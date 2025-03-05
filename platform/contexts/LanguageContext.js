import React, { createContext, useContext, useState, useEffect } from 'react';

// Default translations
const translations = {
    en: {
        // Authentication
        login: 'Login',
        register: 'Register',
        forgotPassword: 'Forgot Password',
            resetPassword: 'Reset Password',
            username: 'Username',
            password: 'Password',
            email: 'Email',
            fullName: 'Full Name',

            // Dashboard
            dashboard: 'Dashboard',
            overview: 'Overview',
            devices: 'Devices',
            data: 'Data',
            alerts: 'Alerts',
            users: 'Users',
            settings: 'Settings',
            logout: 'Logout',

            // Devices
            deviceManagement: 'Device Management',
            registerDevice: 'Register Device',
            deviceName: 'Device Name',
            deviceType: 'Device Type',
            location: 'Location',
            status: 'Status',
            active: 'Active',
            inactive: 'Inactive',
            deactivate: 'Deactivate',
            viewDetails: 'View Details',

            // Data Records
            dataRecords: 'Data Records',
            registerData: 'Register Data',
            recordId: 'Record ID',
            dataCategory: 'Data Category',
            timestamp: 'Timestamp',
            valid: 'Valid',
            invalid: 'Invalid',
            invalidate: 'Invalidate',

            // Alerts
            alertManagement: 'Alert Management',
            triggerAlert: 'Trigger Alert',
            alertId: 'Alert ID',
            severity: 'Severity',
            low: 'Low',
            medium: 'Medium',
            high: 'High',
            critical: 'Critical',
            alertType: 'Alert Type',
            description: 'Description',
            resolved: 'Resolved',
            unresolved: 'Unresolved',
            resolve: 'Resolve',

            // Users
            userManagement: 'User Management',
            addUser: 'Add User',
            userId: 'User ID',
            role: 'Role',
            admin: 'Admin',
            manager: 'Manager',
            supervisor: 'Supervisor',
            worker: 'Worker',
            accessLevel: 'Access Level',
            department: 'Department',

            // Settings
            languageSettings: 'Language Settings',
            themeSettings: 'Theme Settings',
            securitySettings: 'Security Settings',
            notificationSettings: 'Notification Settings',
            enableMfa: 'Enable Two-Factor Authentication',
            changePassword: 'Change Password',

            // System
            systemHealth: 'System Health',
            blockchainStatus: 'Blockchain Status',
            connected: 'Connected',
            disconnected: 'Disconnected',
            reconnect: 'Reconnect',

            // Misc
            save: 'Save',
            cancel: 'Cancel',
            confirm: 'Confirm',
            delete: 'Delete',
            edit: 'Edit',
            add: 'Add',
            search: 'Search',
            filter: 'Filter',
            noData: 'No data available',
            loading: 'Loading...',
            error: 'Error',
            success: 'Success',
            warning: 'Warning',
            info: 'Information'
    },
    ar: {
        // Authentication
        login: 'تسجيل الدخول',
        register: 'تسجيل حساب جديد',
        forgotPassword: 'نسيت كلمة المرور',
            resetPassword: 'إعادة تعيين كلمة المرور',
            username: 'اسم المستخدم',
            password: 'كلمة المرور',
            email: 'البريد الإلكتروني',
            fullName: 'الاسم الكامل',

            // Dashboard
            dashboard: 'لوحة التحكم',
            overview: 'نظرة عامة',
            devices: 'الأجهزة',
            data: 'البيانات',
            alerts: 'التنبيهات',
            users: 'المستخدمون',
            settings: 'الإعدادات',
            logout: 'تسجيل الخروج',

            // Devices
            deviceManagement: 'إدارة الأجهزة',
            registerDevice: 'تسجيل جهاز جديد',
            deviceName: 'اسم الجهاز',
            deviceType: 'نوع الجهاز',
            location: 'الموقع',
            status: 'الحالة',
            active: 'نشط',
            inactive: 'غير نشط',
            deactivate: 'إلغاء تنشيط',
            viewDetails: 'عرض التفاصيل',

            // Data Records
            dataRecords: 'سجلات البيانات',
            registerData: 'تسجيل بيانات جديدة',
            recordId: 'معرف السجل',
            dataCategory: 'فئة البيانات',
            timestamp: 'الطابع الزمني',
            valid: 'صالح',
            invalid: 'غير صالح',
            invalidate: 'إبطال',

            // Alerts
            alertManagement: 'إدارة التنبيهات',
            triggerAlert: 'إطلاق تنبيه',
            alertId: 'معرف التنبيه',
            severity: 'شدة التنبيه',
            low: 'منخفض',
            medium: 'متوسط',
            high: 'مرتفع',
            critical: 'حرج',
            alertType: 'نوع التنبيه',
            description: 'الوصف',
            resolved: 'تم الحل',
            unresolved: 'غير محلول',
            resolve: 'حل',

            // Users
            userManagement: 'إدارة المستخدمين',
            addUser: 'إضافة مستخدم',
            userId: 'معرف المستخدم',
            role: 'الدور',
            admin: 'مسؤول',
            manager: 'مدير',
            supervisor: 'مشرف',
            worker: 'عامل',
            accessLevel: 'مستوى الوصول',
            department: 'القسم',

            // Settings
            languageSettings: 'إعدادات اللغة',
            themeSettings: 'إعدادات المظهر',
            securitySettings: 'إعدادات الأمان',
            notificationSettings: 'إعدادات الإشعارات',
            enableMfa: 'تفعيل المصادقة الثنائية',
            changePassword: 'تغيير كلمة المرور',

            // System
            systemHealth: 'صحة النظام',
            blockchainStatus: 'حالة البلوكتشين',
            connected: 'متصل',
            disconnected: 'غير متصل',
            reconnect: 'إعادة الاتصال',

            // Misc
            save: 'حفظ',
            cancel: 'إلغاء',
            confirm: 'تأكيد',
            delete: 'حذف',
            edit: 'تعديل',
            add: 'إضافة',
            search: 'بحث',
            filter: 'تصفية',
            noData: 'لا توجد بيانات متاحة',
            loading: 'جاري التحميل...',
            error: 'خطأ',
            success: 'نجاح',
            warning: 'تحذير',
            info: 'معلومات'
    }
};

const LanguageContext = createContext();

export const useLanguage = () => useContext(LanguageContext);

export const LanguageProvider = ({ children }) => {
    // Get user language from localStorage or use browser default
    const getBrowserLanguage = () => {
        const browserLang = navigator.language.split('-')[0];
        return browserLang === 'ar' ? 'ar' : 'en'; // Only support en and ar for now
    };

    const [language, setLanguage] = useState(() => {
        const savedLanguage = localStorage.getItem('language');
        return savedLanguage || getBrowserLanguage();
    });

    const [textDirection, setTextDirection] = useState(() => {
        return language === 'ar' ? 'rtl' : 'ltr';
    });

    // Update direction whenever language changes
    useEffect(() => {
        setTextDirection(language === 'ar' ? 'rtl' : 'ltr');
        document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
        document.documentElement.lang = language;
        localStorage.setItem('language', language);
    }, [language]);

    // Function to change language
    const changeLanguage = (lang) => {
        if (lang === 'ar' || lang === 'en') {
            setLanguage(lang);
        }
    };

    // Translation function
    const t = (key) => {
        return translations[language][key] || key;
    };

    return (
        <LanguageContext.Provider value={{
            language,
            changeLanguage,
            t,
            textDirection,
            isRTL: language === 'ar'
        }}>
        {children}
        </LanguageContext.Provider>
    );
};
