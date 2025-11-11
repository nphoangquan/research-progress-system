import type { PreferencesFormState } from '../hooks/useAccountSettings';
import { Save, Palette, Globe, Clock } from 'lucide-react';

interface PreferencesSettingsProps {
  form: PreferencesFormState;
  onChange: (field: keyof PreferencesFormState, value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isSaving: boolean;
}

export function PreferencesSettings({ form, onChange, onSubmit, isSaving }: PreferencesSettingsProps) {
  return (
    <div className="card">
      <div className="card-header">
        <h2 className="text-xl font-semibold text-gray-900">Tùy chọn</h2>
        <p className="text-sm text-gray-600">Tùy chỉnh trải nghiệm của bạn</p>
      </div>
      <div className="card-body">
        <form onSubmit={onSubmit} className="space-y-6">
          <div>
            <label htmlFor="theme" className="block text-sm font-medium text-gray-700 mb-2">
              Giao diện
            </label>
            <div className="relative">
              <Palette className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <select
                id="theme"
                name="theme"
                className="input pl-10"
                value={form.theme}
                onChange={(event) => onChange('theme', event.target.value)}
              >
                <option value="light">Sáng</option>
                <option value="dark">Tối</option>
                <option value="auto">Tự động (Hệ thống)</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="language" className="block text-sm font-medium text-gray-700 mb-2">
              Ngôn ngữ
            </label>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <select
                id="language"
                name="language"
                className="input pl-10"
                value={form.language}
                onChange={(event) => onChange('language', event.target.value)}
              >
                <option value="vi">Tiếng Việt</option>
                <option value="en">English</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="timezone" className="block text-sm font-medium text-gray-700 mb-2">
              Múi giờ
            </label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <select
                id="timezone"
                name="timezone"
                className="input pl-10"
                value={form.timezone}
                onChange={(event) => onChange('timezone', event.target.value)}
              >
                <option value="Asia/Ho_Chi_Minh">Asia/Ho_Chi_Minh (GMT+7)</option>
                <option value="UTC">UTC (GMT+0)</option>
                <option value="America/New_York">America/New_York (GMT-5)</option>
                <option value="Europe/London">Europe/London (GMT+0)</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="btn-primary flex items-center"
              disabled={isSaving}
            >
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? 'Đang lưu...' : 'Lưu Tùy chọn'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
