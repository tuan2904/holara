import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  AlertCircle, ArrowLeft, CheckCircle2, Loader2, Save, Stethoscope,
} from 'lucide-react';
import specialtyService from '../../services/specialtyService';

const SpecialtyFormPage = () => {
  const { t } = useTranslation();
  const { specialtyId } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!specialtyId;

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    parent_id: '',
    description: '',
    status: 'active'
  });

  const [allSpecialties, setAllSpecialties] = useState([]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('error'); // 'success' | 'error'

  const fetchSpecialty = useCallback(async () => {
    try {
      setLoading(true);
      const response = await specialtyService.getSpecialtyById(specialtyId);
      const specialty = response.data;
      setFormData({
        name: specialty.name || '',
        code: specialty.code || '',
        parent_id: specialty.parent_id || '',
        description: specialty.description || '',
        status: specialty.status || 'active'
      });
    } catch (error) {
      setMessage(error.response?.data?.message || t('common.error'));
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  }, [specialtyId, t]);

  useEffect(() => { if (isEditMode) fetchSpecialty(); }, [isEditMode, fetchSpecialty]);

  useEffect(() => {
    const fetchAllSpecialties = async () => {
      try {
        const response = await specialtyService.getAllSpecialties();
        setAllSpecialties(response.data || []);
      } catch (error) {
        console.error("Error fetching specialties list:", error);
      }
    };
    fetchAllSpecialties();
  }, []);

  useEffect(() => {
    if (!message || messageType !== 'success') return;
    const id = setTimeout(() => setMessage(''), 3000);
    return () => clearTimeout(id);
  }, [message, messageType]);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = t('specialty.nameRequired');
    if (!formData.code.trim()) newErrors.code = t('specialty.codeRequired');
    if (formData.code.trim() && !/^[A-Z0-9_]+$/.test(formData.code)) newErrors.code = t('specialty.codeInvalid');
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) { setMessage(t('common.pleaseFixErrors')); setMessageType('error'); return; }

    try {
      setSaving(true);
      const payload = { name: formData.name.trim(), code: formData.code.trim(), parent_id: formData.parent_id || null, description: formData.description.trim(), status: formData.status };
      if (isEditMode) {
        await specialtyService.updateSpecialty(specialtyId, payload);
        setMessage(t('specialty.updateSuccess')); setMessageType('success');
      } else {
        await specialtyService.createSpecialty(payload);
        setMessage(t('specialty.createSuccess')); setMessageType('success');
      }
      setTimeout(() => navigate('/admin/specialties'), 1500);
    } catch (error) {
      setMessage(error.response?.data?.message || t('common.error'));
      setMessageType('error');
    } finally { setSaving(false); }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-teal-500 border-r-transparent" />
        <p className="mt-3 text-sm text-text-dim">{t("common.loading")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* ── Hero Header ─────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 p-6 sm:p-8 text-white">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-teal-500/10 blur-3xl" />
        <div className="absolute -bottom-6 -left-6 h-32 w-32 rounded-full bg-teal-400/10 blur-2xl" />
        <div className="relative">
          <button onClick={() => navigate('/admin/specialties')}
            className="mb-3 inline-flex items-center gap-1.5 rounded-lg text-sm text-slate-300 transition hover:text-white">
            <ArrowLeft className="h-4 w-4" />{t('specialty.managementTitle')}
          </button>
          <div className="flex items-center gap-2">
            <Stethoscope className="h-6 w-6 text-teal-400" />
            <h1 className="text-xl sm:text-2xl font-bold">
              {isEditMode ? t('specialty.editTitle') : t('specialty.addTitle')}
            </h1>
          </div>
          <p className="mt-1 text-sm text-slate-300">
            {isEditMode ? t('specialty.editSubtitle') : t('specialty.addSubtitle')}
          </p>
        </div>
      </div>

      {/* ── Messages ────────────────────────────────── */}
      {message && messageType === 'success' && (
        <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-800/40 dark:bg-emerald-900/15 dark:text-emerald-400">
          <CheckCircle2 className="h-4 w-4 shrink-0" />{message}
        </div>
      )}
      {message && messageType === 'error' && (
        <div className="flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800/40 dark:bg-red-900/15 dark:text-red-400">
          <AlertCircle className="h-4 w-4 shrink-0" />{message}
        </div>
      )}

      {/* ── Form ────────────────────────────────────── */}
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Section 1: Basic Information */}
        <div className="rounded-2xl border border-border-main bg-bg-surface p-5 sm:p-6 dark:bg-slate-800">
          <h3 className="mb-4 flex items-center gap-2 text-base font-bold text-text-main">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-teal-500 text-xs font-bold text-white">1</span>
            {t('specialty.basicInfo')}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Name */}
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-text-main">
                {t('specialty.name')} <span className="text-red-500">*</span>
              </label>
              <input type="text" name="name" value={formData.name} onChange={handleChange}
                placeholder={t('specialty.namePlaceholder')}
                className={`w-full rounded-xl border px-4 py-2.5 text-sm text-text-main outline-none transition bg-bg-app focus:ring-2 focus:ring-teal-500/40 dark:bg-slate-900 ${
                  errors.name ? 'border-red-500' : 'border-border-main'
                }`} />
              {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
            </div>
            {/* Code */}
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-text-main">
                {t('specialty.code')} <span className="text-red-500">*</span>
              </label>
              <input type="text" name="code" value={formData.code} onChange={handleChange}
                placeholder={t('specialty.codePlaceholder')} disabled={isEditMode}
                className={`w-full rounded-xl border px-4 py-2.5 text-sm text-text-main outline-none transition bg-bg-app focus:ring-2 focus:ring-teal-500/40 disabled:opacity-60 disabled:cursor-not-allowed dark:bg-slate-900 ${
                  errors.code ? 'border-red-500' : 'border-border-main'
                }`} />
              {errors.code && <p className="mt-1 text-xs text-red-500">{errors.code}</p>}
            </div>
            {/* Status */}
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-text-main">{t('specialty.status')}</label>
              <select name="status" value={formData.status} onChange={handleChange}
                className="w-full appearance-none rounded-xl border border-border-main bg-bg-app px-4 py-2.5 text-sm text-text-main outline-none transition focus:ring-2 focus:ring-teal-500/40 dark:bg-slate-900">
                <option value="active">{t('common.active')}</option>
                <option value="inactive">{t('common.inactive')}</option>
              </select>
            </div>
            {/* Parent */}
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-text-main">Parent Specialty</label>
              <select name="parent_id" value={formData.parent_id} onChange={handleChange}
                className="w-full appearance-none rounded-xl border border-border-main bg-bg-app px-4 py-2.5 text-sm text-text-main outline-none transition focus:ring-2 focus:ring-teal-500/40 dark:bg-slate-900">
                <option value="">None (Root specialty)</option>
                {allSpecialties
                  .filter((item) => !isEditMode || String(item.id) !== String(specialtyId))
                  .map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.parent_name ? `${item.parent_name} > ${item.name}` : item.name}
                    </option>
                  ))}
              </select>
            </div>
          </div>
        </div>

        {/* Section 2: Description */}
        <div className="rounded-2xl border border-border-main bg-bg-surface p-5 sm:p-6 dark:bg-slate-800">
          <h3 className="mb-4 flex items-center gap-2 text-base font-bold text-text-main">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-teal-500 text-xs font-bold text-white">2</span>
            {t('specialty.description')}
          </h3>
          <textarea name="description" value={formData.description} onChange={handleChange}
            placeholder={t('specialty.descriptionPlaceholder')} rows="4"
            className="w-full rounded-xl border border-border-main bg-bg-app px-4 py-2.5 text-sm text-text-main outline-none transition focus:ring-2 focus:ring-teal-500/40 resize-none dark:bg-slate-900" />
        </div>

        {/* ── Sticky Action Bar ─────────────────────── */}
        <div className="sticky bottom-0 z-10 -mx-1 rounded-2xl border border-border-main bg-bg-surface/80 px-5 py-4 shadow-lg backdrop-blur dark:bg-slate-800/80">
          <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-3">
            <button type="button" onClick={() => navigate('/admin/specialties')} disabled={saving}
              className="w-full sm:w-auto rounded-xl border border-border-main px-5 py-2.5 text-sm font-semibold text-text-main transition hover:bg-bg-app disabled:opacity-50">
              {t('common.cancel')}
            </button>
            <button type="submit" disabled={saving}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-teal-500 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-teal-500/25 transition hover:bg-teal-600 disabled:opacity-50">
              {saving ? (
                <><Loader2 className="h-4 w-4 animate-spin" />{t('common.saving')}</>
              ) : (
                <><Save className="h-4 w-4" />{isEditMode ? t('common.update') : t('common.create')}</>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default SpecialtyFormPage;
