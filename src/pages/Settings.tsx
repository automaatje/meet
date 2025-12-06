import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { User, Building2, LogOut, Save, Euro, FileText, Upload, Package, Users, Download, Zap, Palette, Shield, Code, Target } from 'lucide-react';
import PriceTemplates from '../components/pricing/PriceTemplates';
import Products from './settings/Products';
import { Team } from './settings/Team';
import { Export } from './settings/Export';
import { IntegrationsUpgrade } from './settings/IntegrationsUpgrade';
import { Branding } from './settings/Branding';
import { Security } from './settings/Security';
import { DeveloperAPI } from './settings/DeveloperAPI';
import { SalesTargets } from './settings/SalesTargets';
import { useOrganization } from '../contexts/OrganizationContext';
import { RoleTestSwitcher } from '../components/team/RoleTestSwitcher';
import { canSwitchToTestMode } from '../lib/permissions';
import type { Database } from '../lib/database.types';

type UserProfile = Database['public']['Tables']['user_profiles']['Row'];
type TabType = 'profile' | 'company' | 'pricing' | 'products' | 'team' | 'quote' | 'export' | 'integrations' | 'branding' | 'security' | 'api' | 'targets';

export default function Settings() {
  const { user, signOut } = useAuth();
  const { currentMember, activeTestRole, effectiveRole, permissions, switchToTestRole, switchBackFromTestRole } = useOrganization();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('profile');

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    const { data } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user!.id)
      .maybeSingle();

    setProfile(data);
    setLoading(false);
  };

  const saveProfile = async () => {
    if (!profile) return;
    setSaving(true);

    await supabase
      .from('user_profiles')
      .upsert({
        id: user!.id,
        ...profile,
      });

    setSaving(false);
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploadingLogo(true);
    try {
      if (file.size > 2 * 1024 * 1024) {
        alert('Logo is te groot. Maximaal 2MB toegestaan.');
        return;
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-logo.${fileExt}`;
      const filePath = `logos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('company-assets')
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        alert('Fout bij uploaden logo: ' + uploadError.message);
        return;
      }

      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({ logo_url: filePath })
        .eq('id', user.id);

      if (updateError) {
        console.error('Error updating profile:', updateError);
        alert('Logo geüpload maar niet opgeslagen in profiel.');
        return;
      }

      setProfile({ ...profile!, logo_url: filePath });
      alert('Logo succesvol geüpload!');
    } catch (error) {
      console.error('Error uploading logo:', error);
      alert('Er is een fout opgetreden bij het uploaden van het logo.');
    } finally {
      setUploadingLogo(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary"></div>
      </div>
    );
  }

  const teamReadValue = permissions?.team?.read;
  const canReadTeam = teamReadValue === 'all' || teamReadValue === 'team' || teamReadValue === true;
  const canReadTargets = ['sales_manager', 'head_of_sales', 'admin', 'owner'].includes(effectiveRole);

  const tabs = [
    { id: 'profile' as TabType, label: 'Profiel', icon: User },
    { id: 'company' as TabType, label: 'Bedrijfsgegevens', icon: Building2 },
    { id: 'pricing' as TabType, label: 'Prijssjablonen', icon: Euro },
    { id: 'products' as TabType, label: 'Producten', icon: Package },
    ...(canReadTeam ? [{ id: 'team' as TabType, label: 'Team', icon: Users }] : []),
    ...(canReadTargets ? [{ id: 'targets' as TabType, label: 'Sales Doelen', icon: Target }] : []),
    { id: 'branding' as TabType, label: 'Huisstijl', icon: Palette },
    { id: 'security' as TabType, label: 'Beveiliging', icon: Shield },
    { id: 'quote' as TabType, label: 'Offerte Instellingen', icon: FileText },
    { id: 'export' as TabType, label: 'Export & Backup', icon: Download },
    { id: 'integrations' as TabType, label: 'Integraties', icon: Zap },
    { id: 'api' as TabType, label: 'Developer API', icon: Code },
  ];

  return (
    <div className="p-4 space-y-6 pb-8">
      <div className="pt-4">
        <h1 className="text-2xl font-bold text-gray-900">Instellingen</h1>
        <p className="text-gray-600 mt-1">Beheer je profiel en voorkeuren</p>
      </div>

      {currentMember && canSwitchToTestMode(currentMember.role) && (
        <RoleTestSwitcher
          currentRole={currentMember.role}
          activeTestRole={activeTestRole}
          onSwitchToTest={switchToTestRole}
          onSwitchBack={switchBackFromTestRole}
        />
      )}

      <div className="flex gap-2 overflow-x-auto pb-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition whitespace-nowrap flex-shrink-0
                ${activeTab === tab.id
                  ? 'bg-brand-primary text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:border-blue-400'
                }
              `}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span className="flex-shrink-0">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {activeTab === 'profile' && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-blue-100 p-3 rounded-lg">
              <User className="w-6 h-6 text-brand-primary" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Persoonlijke gegevens</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                E-mailadres
              </label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Naam
              </label>
              <input
                type="text"
                value={profile?.contact_name || ''}
                onChange={(e) => setProfile({ ...profile!, contact_name: e.target.value })}
                placeholder="Jouw naam"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Telefoonnummer
              </label>
              <input
                type="tel"
                value={profile?.phone || ''}
                onChange={(e) => setProfile({ ...profile!, phone: e.target.value })}
                placeholder="+31 6 12345678"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
              />
            </div>
          </div>

          <button
            onClick={saveProfile}
            disabled={saving}
            className="w-full mt-6 bg-brand-primary hover:opacity-90 text-white font-medium py-3 px-4 rounded-lg transition disabled:opacity-50 min-h-[48px] flex items-center justify-center gap-2"
          >
            <Save className="w-5 h-5" />
            {saving ? 'Bezig met opslaan...' : 'Profiel opslaan'}
          </button>
        </div>
      )}

      {activeTab === 'company' && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-green-100 p-3 rounded-lg">
              <Building2 className="w-6 h-6 text-brand-secondary" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Bedrijfsgegevens</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bedrijfsnaam
              </label>
              <input
                type="text"
                value={profile?.company_name || ''}
                onChange={(e) => setProfile({ ...profile!, company_name: e.target.value })}
                placeholder="Jouw Schildersbedrijf B.V."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                KVK-nummer
              </label>
              <input
                type="text"
                value={profile?.kvk_number || ''}
                onChange={(e) => setProfile({ ...profile!, kvk_number: e.target.value })}
                placeholder="12345678"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                BTW-nummer
              </label>
              <input
                type="text"
                value={profile?.btw_number || ''}
                onChange={(e) => setProfile({ ...profile!, btw_number: e.target.value })}
                placeholder="NL123456789B01"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Adres
              </label>
              <input
                type="text"
                value={profile?.address || ''}
                onChange={(e) => setProfile({ ...profile!, address: e.target.value })}
                placeholder="Straatnaam 123"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Postcode
                </label>
                <input
                  type="text"
                  value={profile?.postal_code || ''}
                  onChange={(e) => setProfile({ ...profile!, postal_code: e.target.value })}
                  placeholder="1234 AB"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Plaats
                </label>
                <input
                  type="text"
                  value={profile?.city || ''}
                  onChange={(e) => setProfile({ ...profile!, city: e.target.value })}
                  placeholder="Amsterdam"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
                />
              </div>
            </div>
          </div>

          <button
            onClick={saveProfile}
            disabled={saving}
            className="w-full mt-6 bg-brand-primary hover:opacity-90 text-white font-medium py-3 px-4 rounded-lg transition disabled:opacity-50 min-h-[48px] flex items-center justify-center gap-2"
          >
            <Save className="w-5 h-5" />
            {saving ? 'Bezig met opslaan...' : 'Profiel opslaan'}
          </button>
        </div>
      )}

      {activeTab === 'pricing' && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-yellow-100 p-3 rounded-lg">
              <Euro className="w-6 h-6 text-yellow-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Prijssjablonen</h2>
          </div>
          <PriceTemplates />
        </div>
      )}

      {activeTab === 'products' && <Products />}

      {activeTab === 'team' && <Team />}

      {activeTab === 'quote' && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-purple-100 p-3 rounded-lg">
              <FileText className="w-6 h-6 text-purple-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Offerte Instellingen</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bedrijfslogo
              </label>
              <div className="flex items-center gap-4">
                <label className={`flex items-center gap-2 bg-brand-primary hover:opacity-90 text-white font-medium py-2 px-4 rounded-lg transition cursor-pointer ${
                  uploadingLogo ? 'opacity-50 cursor-not-allowed' : ''
                }`}>
                  <Upload className="w-4 h-4" />
                  {uploadingLogo ? 'Bezig met uploaden...' : 'Upload Logo'}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                    disabled={uploadingLogo}
                  />
                </label>
                {profile?.logo_url && !uploadingLogo && (
                  <span className="text-sm text-brand-secondary">Logo geüpload</span>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Aanbevolen: PNG of JPG, max 2MB
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Betalingsvoorwaarden
              </label>
              <textarea
                value={profile?.payment_terms || ''}
                onChange={(e) => setProfile({ ...profile!, payment_terms: e.target.value })}
                placeholder="Bijv: 30 dagen netto na factuurdatum. Bij te late betaling worden wettelijke rente en incassokosten in rekening gebracht."
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Algemene Voorwaarden
              </label>
              <textarea
                value={profile?.general_conditions || ''}
                onChange={(e) => setProfile({ ...profile!, general_conditions: e.target.value })}
                placeholder="Bijv: Op deze offerte zijn onze algemene voorwaarden van toepassing. Deze zijn te downloaden via onze website."
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
              />
            </div>
          </div>

          <button
            onClick={saveProfile}
            disabled={saving}
            className="w-full mt-6 bg-brand-primary hover:opacity-90 text-white font-medium py-3 px-4 rounded-lg transition disabled:opacity-50 min-h-[48px] flex items-center justify-center gap-2"
          >
            <Save className="w-5 h-5" />
            {saving ? 'Bezig met opslaan...' : 'Instellingen opslaan'}
          </button>
        </div>
      )}

      {activeTab === 'export' && <Export />}

      {activeTab === 'branding' && <Branding />}

      {activeTab === 'security' && <Security />}

      {activeTab === 'integrations' && <IntegrationsUpgrade />}

      {activeTab === 'api' && <DeveloperAPI />}
      {activeTab === 'targets' && <SalesTargets />}

      <button
        onClick={signOut}
        className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-3 px-4 rounded-lg transition min-h-[48px] flex items-center justify-center gap-2"
      >
        <LogOut className="w-5 h-5" />
        Uitloggen
      </button>
    </div>
  );
}
