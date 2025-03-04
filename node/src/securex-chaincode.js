// securex-chaincode.js - Hyperledger Fabric chaincode for SecureX
// Developed by dev-760

'use strict';

const { Contract } = require('fabric-contract-api');

class SecureXContract extends Contract {

  // Initialize ledger with default values
  async initLedger(ctx) {
    console.info('============= Initialize Ledger ==============');
    return 'Ledger initialized successfully';
  }

  // Access Control Functions

  async addUser(ctx, userId, walletAddress, accessLevel, userHashData) {
    console.info('============= Adding User ==============');

    // Check caller authorization
    const clientID = this._getTxCreatorUID(ctx);
    await this._checkAdminRole(ctx, clientID);

    const user = {
      userId: userId,
      walletAddress: walletAddress,
      accessLevel: parseInt(accessLevel),
      userHash: userHashData,
      isActive: true,
      lastAccessTime: Date.now(),
      docType: 'user'
    };

    await ctx.stub.putState(`USER_${userId}`, Buffer.from(JSON.stringify(user)));

    // Emit an event
    await ctx.stub.setEvent('UserAdded', Buffer.from(JSON.stringify({
      userId: userId,
      accessLevel: accessLevel
    })));

    return JSON.stringify(user);
  }

  async deactivateUser(ctx, userId) {
    console.info('============= Deactivating User ==============');

    // Check caller authorization
    const clientID = this._getTxCreatorUID(ctx);
    await this._checkAdminRole(ctx, clientID);

    const userAsBytes = await ctx.stub.getState(`USER_${userId}`);
    if (!userAsBytes || userAsBytes.length === 0) {
      throw new Error(`User ${userId} does not exist`);
    }
    const user = JSON.parse(userAsBytes.toString());

    user.isActive = false;

    await ctx.stub.putState(`USER_${userId}`, Buffer.from(JSON.stringify(user)));

    // Emit event
    await ctx.stub.setEvent('UserDeactivated', Buffer.from(JSON.stringify({
      userId: userId
    })));

    return JSON.stringify(user);
  }

  async checkAccess(ctx, userId, resourceId, requiredLevel) {
    console.info('============= Checking Access ==============');

    const userAsBytes = await ctx.stub.getState(`USER_${userId}`);
    if (!userAsBytes || userAsBytes.length === 0) {
      return { hasAccess: false, reason: 'User does not exist' };
    }

    const user = JSON.parse(userAsBytes.toString());

    if (!user.isActive) {
      await ctx.stub.setEvent('AccessDenied', Buffer.from(JSON.stringify({
        userId: userId,
        resourceId: resourceId,
        reason: 'User inactive'
      })));
      return { hasAccess: false, reason: 'User is inactive' };
    }

    if (user.accessLevel < parseInt(requiredLevel)) {
      await ctx.stub.setEvent('AccessDenied', Buffer.from(JSON.stringify({
        userId: userId,
        resourceId: resourceId,
        reason: 'Insufficient access level'
      })));
      return { hasAccess: false, reason: 'Insufficient access level' };
    }

    // Update last access time
    user.lastAccessTime = Date.now();
    await ctx.stub.putState(`USER_${userId}`, Buffer.from(JSON.stringify(user)));

    await ctx.stub.setEvent('AccessGranted', Buffer.from(JSON.stringify({
      userId: userId,
      resourceId: resourceId
    })));

    return { hasAccess: true };
  }

  // Device Management Functions

  async registerDevice(ctx, deviceName, deviceType, location, metadataHash, registeredBy) {
    console.info('============= Registering Device ==============');

    // Check caller authorization
    const accessCheck = await this.checkAccess(ctx, registeredBy, 'DEVICE_REGISTRATION', '3');
    if (!accessCheck.hasAccess) {
      throw new Error(`Access denied: ${accessCheck.reason}`);
    }

    // Generate unique device ID
    const deviceId = ctx.stub.getTxID() + '_DEVICE';

    const device = {
      deviceId: deviceId,
      deviceName: deviceName,
      deviceType: deviceType,
      location: location,
      registeredBy: registeredBy,
      registrationTime: Date.now(),
      isActive: true,
      metadataHash: metadataHash,
      docType: 'device'
    };

    await ctx.stub.putState(`DEVICE_${deviceId}`, Buffer.from(JSON.stringify(device)));

    // Add to device index
    await this._addDeviceToIndex(ctx, deviceId);

    // Emit event
    await ctx.stub.setEvent('DeviceRegistered', Buffer.from(JSON.stringify({
      deviceId: deviceId,
      deviceName: deviceName,
      registeredBy: registeredBy
    })));

    return JSON.stringify({ deviceId, ...device });
  }

  async deactivateDevice(ctx, deviceId, requestedBy) {
    console.info('============= Deactivating Device ==============');

    // Check caller authorization
    const accessCheck = await this.checkAccess(ctx, requestedBy, deviceId, '3');
    if (!accessCheck.hasAccess) {
      throw new Error(`Access denied: ${accessCheck.reason}`);
    }

    const deviceAsBytes = await ctx.stub.getState(`DEVICE_${deviceId}`);
    if (!deviceAsBytes || deviceAsBytes.length === 0) {
      throw new Error(`Device ${deviceId} does not exist`);
    }

    const device = JSON.parse(deviceAsBytes.toString());

    if (!device.isActive) {
      throw new Error(`Device ${deviceId} is already inactive`);
    }

    device.isActive = false;

    await ctx.stub.putState(`DEVICE_${deviceId}`, Buffer.from(JSON.stringify(device)));

    // Emit event
    await ctx.stub.setEvent('DeviceDeactivated', Buffer.from(JSON.stringify({
      deviceId: deviceId,
      deactivatedBy: requestedBy
    })));

    return JSON.stringify(device);
  }

  async getDeviceInfo(ctx, deviceId) {
    console.info('============= Getting Device Info ==============');

    const deviceAsBytes = await ctx.stub.getState(`DEVICE_${deviceId}`);
    if (!deviceAsBytes || deviceAsBytes.length === 0) {
      throw new Error(`Device ${deviceId} does not exist`);
    }

    return deviceAsBytes.toString();
  }

  // Data Records Functions

  async registerData(ctx, deviceId, dataHash, dataCategory, metadataHash, registeredBy) {
    console.info('============= Registering Data ==============');

    // Check caller authorization
    const accessCheck = await this.checkAccess(ctx, registeredBy, deviceId, '2');
    if (!accessCheck.hasAccess) {
      throw new Error(`Access denied: ${accessCheck.reason}`);
    }

    // Generate unique record ID
    const recordId = ctx.stub.getTxID() + '_RECORD';

    const record = {
      recordId: recordId,
      deviceId: deviceId,
      dataHash: dataHash,
      dataCategory: dataCategory,
      metadataHash: metadataHash,
      registeredBy: registeredBy,
      timestamp: Date.now(),
      isValid: true,
      docType: 'dataRecord'
    };

    await ctx.stub.putState(`RECORD_${recordId}`, Buffer.from(JSON.stringify(record)));

    // Add to device history
    await this._addRecordToDeviceHistory(ctx, deviceId, recordId);

    // Emit event
    await ctx.stub.setEvent('DataRegistered', Buffer.from(JSON.stringify({
      recordId: recordId,
      deviceId: deviceId,
      dataHash: dataHash
    })));

    return JSON.stringify({ recordId, ...record });
  }

  async invalidateData(ctx, recordId, requestedBy) {
    console.info('============= Invalidating Data ==============');

    const recordAsBytes = await ctx.stub.getState(`RECORD_${recordId}`);
    if (!recordAsBytes || recordAsBytes.length === 0) {
      throw new Error(`Record ${recordId} does not exist`);
    }

    const record = JSON.parse(recordAsBytes.toString());

    // Check caller authorization
    const accessCheck = await this.checkAccess(ctx, requestedBy, record.deviceId, '3');
    if (!accessCheck.hasAccess) {
      throw new Error(`Access denied: ${accessCheck.reason}`);
    }

    if (!record.isValid) {
      throw new Error(`Record ${recordId} is already invalidated`);
    }

    record.isValid = false;

    await ctx.stub.putState(`RECORD_${recordId}`, Buffer.from(JSON.stringify(record)));

    // Emit event
    await ctx.stub.setEvent('DataInvalidated', Buffer.from(JSON.stringify({
      recordId: recordId,
      invalidatedBy: requestedBy
    })));

    return JSON.stringify(record);
  }

  async getDeviceDataHistory(ctx, deviceId) {
    console.info('============= Getting Device Data History ==============');

    const historyKey = `DEVICE_HISTORY_${deviceId}`;
    const historyAsBytes = await ctx.stub.getState(historyKey);

    if (!historyAsBytes || historyAsBytes.length === 0) {
      return JSON.stringify([]);
    }

    const history = JSON.parse(historyAsBytes.toString());
    return JSON.stringify(history);
  }

  // Alert Management Functions

  async triggerAlert(ctx, deviceId, severity, alertType, description, triggeredBy) {
    console.info('============= Triggering Alert ==============');

    // Validate severity
    const severityLevel = parseInt(severity);
    if (severityLevel < 0 || severityLevel > 3) {
      throw new Error('Invalid severity level. Must be between 0 and 3');
    }

    // Generate unique alert ID
    const alertId = ctx.stub.getTxID() + '_ALERT';

    const alert = {
      alertId: alertId,
      deviceId: deviceId,
      severity: severityLevel,
      alertType: alertType,
      description: description,
      timestamp: Date.now(),
      isResolved: false,
      resolvedBy: '',
      resolutionTime: 0,
      triggeredBy: triggeredBy,
      docType: 'alert'
    };

    await ctx.stub.putState(`ALERT_${alertId}`, Buffer.from(JSON.stringify(alert)));

    // Add to device alerts
    await this._addAlertToDevice(ctx, deviceId, alertId);

    // Emit event
    await ctx.stub.setEvent('AlertTriggered', Buffer.from(JSON.stringify({
      alertId: alertId,
      deviceId: deviceId,
      severity: severityLevel,
      alertType: alertType
    })));

    return JSON.stringify({ alertId, ...alert });
  }

  async resolveAlert(ctx, alertId, requestedBy) {
    console.info('============= Resolving Alert ==============');

    const alertAsBytes = await ctx.stub.getState(`ALERT_${alertId}`);
    if (!alertAsBytes || alertAsBytes.length === 0) {
      throw new Error(`Alert ${alertId} does not exist`);
    }

    const alert = JSON.parse(alertAsBytes.toString());

    // Check caller authorization
    const accessCheck = await this.checkAccess(ctx, requestedBy, alert.deviceId, '2');
    if (!accessCheck.hasAccess) {
      throw new Error(`Access denied: ${accessCheck.reason}`);
    }

    if (alert.isResolved) {
      throw new Error(`Alert ${alertId} is already resolved`);
    }

    alert.isResolved = true;
    alert.resolvedBy = requestedBy;
    alert.resolutionTime = Date.now();

    await ctx.stub.putState(`ALERT_${alertId}`, Buffer.from(JSON.stringify(alert)));

    // Emit event
    await ctx.stub.setEvent('AlertResolved', Buffer.from(JSON.stringify({
      alertId: alertId,
      resolvedBy: requestedBy
    })));

    return JSON.stringify(alert);
  }

  async getDeviceAlerts(ctx, deviceId, includeResolved) {
    console.info('============= Getting Device Alerts ==============');

    const includeResolvedAlerts = includeResolved === 'true';

    const query = {
      selector: {
        docType: 'alert',
        deviceId: deviceId
      }
    };

    if (!includeResolvedAlerts) {
      query.selector.isResolved = false;
    }

    const iterator = await ctx.stub.getQueryResult(JSON.stringify(query));
    const results = await this._getIteratorResults(iterator);

    return JSON.stringify(results);
  }

  // Helper Functions

  async _addDeviceToIndex(ctx, deviceId) {
    const indexKey = 'DEVICE_INDEX';
    const indexAsBytes = await ctx.stub.getState(indexKey);

    let index = [];
    if (indexAsBytes && indexAsBytes.length > 0) {
      index = JSON.parse(indexAsBytes.toString());
    }

    index.push(deviceId);
    await ctx.stub.putState(indexKey, Buffer.from(JSON.stringify(index)));
  }

  async _addRecordToDeviceHistory(ctx, deviceId, recordId) {
    const historyKey = `DEVICE_HISTORY_${deviceId}`;
    const historyAsBytes = await ctx.stub.getState(historyKey);

    let history = [];
    if (historyAsBytes && historyAsBytes.length > 0) {
      history = JSON.parse(historyAsBytes.toString());
    }

    history.push(recordId);
    await ctx.stub.putState(historyKey, Buffer.from(JSON.stringify(history)));
  }

  async _addAlertToDevice(ctx, deviceId, alertId) {
    const alertsKey = `DEVICE_ALERTS_${deviceId}`;
    const alertsAsBytes = await ctx.stub.getState(alertsKey);

    let alerts = [];
    if (alertsAsBytes && alertsAsBytes.length > 0) {
      alerts = JSON.parse(alertsAsBytes.toString());
    }

    alerts.push(alertId);
    await ctx.stub.putState(alertsKey, Buffer.from(JSON.stringify(alerts)));
  }

  async _getIteratorResults(iterator) {
    const results = [];
    let result = await iterator.next();

    while (!result.done) {
      const strValue = Buffer.from(result.value.value.toString()).toString('utf8');
      let record;
      try {
        record = JSON.parse(strValue);
      } catch (err) {
        record = strValue;
      }
      results.push(record);
      result = await iterator.next();
    }

    return results;
  }

  _getTxCreatorUID(ctx) {
    return ctx.clientIdentity.getID();
  }

  async _checkAdminRole(ctx, clientID) {
    // Get the role of the client from the clientIdentity
    const isAdmin = ctx.clientIdentity.assertAttributeValue('role', 'admin');
    if (!isAdmin) {
      throw new Error('Only admins can perform this operation');
    }
  }
}

module.exports = SecureXContract;
