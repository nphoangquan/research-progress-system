import { useAccountSettings } from "../../features/account/hooks/useAccountSettings";
import { SettingsSidebar } from "../../features/account/components/SettingsSidebar";
import { ProfileSettings } from "../../features/account/components/ProfileSettings";
import { SecuritySettings } from "../../features/account/components/SecuritySettings";
// TODO: Re-enable when preferences feature is ready
// import { PreferencesSettings } from "../../features/account/components/PreferencesSettings";
import { useEffect } from "react";

export default function AccountSettingsPage() {
  const {
    user,
    userProfile,
    isLoading,
    activeTab,
    setActiveTab,
    profileForm,
    passwordForm,
    preferencesForm,
    profileErrors,
    passwordErrors,
    handleProfileChange,
    handlePasswordChange,
    handlePreferencesChange,
    handleProfileSubmit,
    handlePasswordSubmit,
    handlePreferencesSubmit,
    isSavingPreferences,
    uploadAvatarPending,
    handleAvatarChange,
    showPassword,
    showNewPassword,
    showConfirmPassword,
    togglePasswordVisibility,
    toggleNewPasswordVisibility,
    toggleConfirmPasswordVisibility,
    changePasswordPending,
    updateProfilePending,
  } = useAccountSettings();

  useEffect(() => {
    document.title = "Hồ sơ & Cài đặt | Research Progress System";
  }, []);

  if (!user) {
    return (
      <div className="flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="w-full">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải hồ sơ...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="page-header">
        <h1 className="page-title">Hồ sơ Người dùng & Cài đặt</h1>
        <p className="page-subtitle">
          Quản lý cài đặt tài khoản và tùy chọn của bạn
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1">
          <SettingsSidebar activeTab={activeTab} onTabChange={setActiveTab} />
        </div>

        <div className="lg:col-span-3 space-y-6">
          {activeTab === "profile" && (
            <ProfileSettings
              form={profileForm}
              errors={profileErrors}
              onChange={handleProfileChange}
              onSubmit={handleProfileSubmit}
              isSubmitting={updateProfilePending}
              userProfile={userProfile}
              onAvatarChange={handleAvatarChange}
              isUploadingAvatar={uploadAvatarPending}
              isStudent={user.role === "STUDENT"}
            />
          )}

          {activeTab === "security" && (
            <SecuritySettings
              form={passwordForm}
              errors={passwordErrors}
              onChange={handlePasswordChange}
              onSubmit={handlePasswordSubmit}
              isSubmitting={changePasswordPending}
              showPassword={showPassword}
              showNewPassword={showNewPassword}
              showConfirmPassword={showConfirmPassword}
              togglePasswordVisibility={togglePasswordVisibility}
              toggleNewPasswordVisibility={toggleNewPasswordVisibility}
              toggleConfirmPasswordVisibility={toggleConfirmPasswordVisibility}
            />
          )}

          {/* TODO: Re-enable when preferences feature is ready
          {activeTab === "preferences" && (
            <PreferencesSettings
              form={preferencesForm}
              onChange={handlePreferencesChange}
              onSubmit={handlePreferencesSubmit}
              isSaving={isSavingPreferences}
            />
          )}
          */}
        </div>
      </div>
    </div>
  );
}
