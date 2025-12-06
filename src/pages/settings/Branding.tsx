import React, { useState, useEffect } from 'react';
import { Palette, Upload, Eye, Save, RotateCcw, AlertTriangle, CheckCircle2, Image as ImageIcon, Globe } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useOrganization } from '../../contexts/OrganizationContext';
import { useTheme } from '../../contexts/ThemeContext';
import {
  PRESET_THEMES,
  AVAILABLE_FONTS,
  isAccessible,
  validateLogoFile,
  type ThemeColors,
} from '../../lib/branding/theme-generator';

export function Branding() {
  const { organization } = useOrganization();
  const { theme, refreshTheme } = useTheme();
  const [colors, setColors] = useState<ThemeColors>(PRESET_THEMES['Standaard Blauw']);
  const [selectedFont, setSelectedFont] = useState('Inter');
  const [fontSize, setFontSize] = useState(16);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [faviconUrl, setFaviconUrl] = useState<string | null>(null);
  const [customCSS, setCustomCSS] = useState('');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showDomainSetup, setShowDomainSetup] = useState(false);
  const [customDomain, setCustomDomain] = useState('');

  useEffect(() => {
    if (theme) {
      setColors(theme.colors);
      setSelectedFont(theme.fonts.family);
      setFontSize(theme.fonts.baseSize);
      setLogoUrl(theme.logo_url);
      setFaviconUrl(theme.favicon_url);
      setCustomCSS(theme.custom_css || '');
    }
  }, [theme]);

  useEffect(() => {
    if (showDomainSetup) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [showDomainSetup]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !organization) return;

    const validation = validateLogoFile(file);
    if (!validation.valid) {
      alert(validation.error);
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${organization.id}/logo.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('branding-assets')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('branding-assets')
        .getPublicUrl(fileName);

      setLogoUrl(data.publicUrl);
      alert('Logo succesvol geüpload!');
    } catch (error: any) {
      console.error('Error uploading logo:', error);
      alert('Fout bij uploaden: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleFaviconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !organization) return;

    setUploading(true);
    try {
      const fileName = `${organization.id}/favicon.png`;

      const { error: uploadError } = await supabase.storage
        .from('branding-assets')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('branding-assets')
        .getPublicUrl(fileName);

      setFaviconUrl(data.publicUrl);
      alert('Favicon succesvol geüpload!');
    } catch (error: any) {
      console.error('Error uploading favicon:', error);
      alert('Fout bij uploaden: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSaveTheme = async (activate: boolean = false) => {
    if (!organization) return;

    setSaving(true);
    try {
      const themeData = {
        organization_id: organization.id,
        name: 'Custom Theme',
        is_active: activate,
        colors,
        logo_url: logoUrl,
        favicon_url: faviconUrl,
        fonts: {
          family: selectedFont,
          baseSize: fontSize,
        },
        custom_css: customCSS || null,
      };

      if (theme) {
        const { error } = await supabase
          .from('branding_themes')
          .update(themeData)
          .eq('id', theme.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('branding_themes')
          .insert(themeData);

        if (error) throw error;
      }

      await refreshTheme();

      if (activate) {
        alert('✓ Huisstijl geactiveerd!\n\nJe gekozen kleuren en lettertype worden nu door de hele applicatie toegepast:\n\n• Primaire kleur: knoppen, links, actieve navigatie\n• Secundaire kleur: success states, badges\n• Accent kleur: waarschuwingen, highlights\n• Lettertype: alle tekst door de hele app\n• Logo en favicon (indien geüpload)\n\nHerlaad de pagina om alle wijzigingen te zien!');
      } else {
        alert('Concept opgeslagen');
      }
    } catch (error: any) {
      console.error('Error saving theme:', error);
      alert('Fout bij opslaan: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handlePresetSelect = (presetName: string) => {
    setColors(PRESET_THEMES[presetName]);
  };

  const handleColorChange = (colorKey: keyof ThemeColors, value: string) => {
    setColors((prev) => ({ ...prev, [colorKey]: value }));
  };

  const contrastOk = isAccessible(colors.primary, colors.background);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Huisstijl & White-Label</h2>
          <p className="text-gray-600 mt-1">Pas de app aan naar je eigen branding</p>
          {theme?.is_active && (
            <div className="flex items-center gap-2 mt-2">
              <CheckCircle2 className="w-4 h-4 text-brand-secondary" />
              <span className="text-sm text-brand-secondary font-medium">Huisstijl actief</span>
            </div>
          )}
        </div>
        {organization?.subscription_plan === 'starter' && (
          <div className="px-4 py-2 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
            Upgrade naar Business voor volledige branding opties
          </div>
        )}
      </div>

      {/* Info Banner */}
      <div className="bg-green-50 border border-green-200 rounded-xl p-4">
        <div className="flex gap-3">
          <CheckCircle2 className="w-5 h-5 text-brand-secondary flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-medium text-green-900">Huisstijl Systeem Actief</h4>
            <p className="text-sm text-green-800">
              Je kunt nu kleuren en lettertypen selecteren die door de hele applicatie worden toegepast!
              Kies een kleurenschema, selecteer je lettertype, en klik op "Activeren" om je huisstijl
              overal te zien. De kleuren worden dynamisch toegepast op knoppen, links, navigatie en meer.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <Eye className="w-5 h-5" />
            Live Preview
          </h3>
          <span className="text-xs text-gray-500 px-3 py-1 bg-white rounded-full border">
            Voorbeeldweergave
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4" style={{ fontFamily: selectedFont }}>
          <div className="bg-white rounded-lg p-4 border" style={{ backgroundColor: colors.background, color: colors.text }}>
            <div className="flex items-center gap-3 mb-3">
              {logoUrl ? (
                <img src={logoUrl} alt="Logo" className="h-8" />
              ) : (
                <div className="w-8 h-8 rounded bg-gray-300" />
              )}
              <div className="text-sm font-medium">Klant Card</div>
            </div>
            <button
              className="w-full px-3 py-2 rounded-lg text-white text-sm font-medium"
              style={{ backgroundColor: colors.primary }}
            >
              Primaire Knop
            </button>
          </div>

          <div className="bg-white rounded-lg p-4 border" style={{ backgroundColor: colors.background }}>
            <div className="flex gap-2 mb-3">
              <span
                className="px-2 py-1 rounded text-xs font-medium text-white"
                style={{ backgroundColor: colors.secondary }}
              >
                Actief
              </span>
              <span
                className="px-2 py-1 rounded text-xs font-medium text-white"
                style={{ backgroundColor: colors.accent }}
              >
                Pending
              </span>
            </div>
            <div className="text-sm" style={{ color: colors.text }}>
              Status badges voorbeeld
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 border" style={{ backgroundColor: colors.background }}>
            <div className="text-2xl font-bold mb-2" style={{ color: colors.primary }}>
              €12.500
            </div>
            <div className="text-sm" style={{ color: colors.text }}>
              Dashboard widget
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <ImageIcon className="w-5 h-5" />
          Logo's & Iconen
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Hoofdlogo</label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition">
              {logoUrl ? (
                <div className="space-y-3">
                  <img src={logoUrl} alt="Logo" className="h-16 mx-auto" />
                  <button
                    onClick={() => setLogoUrl(null)}
                    className="text-sm text-red-600 hover:text-red-700"
                  >
                    Verwijderen
                  </button>
                </div>
              ) : (
                <label className="cursor-pointer block">
                  <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                  <span className="text-sm text-gray-600">
                    Klik om logo te uploaden
                  </span>
                  <p className="text-xs text-gray-500 mt-2">
                    PNG/JPG/SVG, max 500KB
                  </p>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/svg+xml"
                    onChange={handleLogoUpload}
                    className="hidden"
                    disabled={uploading}
                  />
                </label>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Favicon</label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition">
              {faviconUrl ? (
                <div className="space-y-3">
                  <img src={faviconUrl} alt="Favicon" className="h-8 mx-auto" />
                  <button
                    onClick={() => setFaviconUrl(null)}
                    className="text-sm text-red-600 hover:text-red-700"
                  >
                    Verwijderen
                  </button>
                </div>
              ) : (
                <label className="cursor-pointer block">
                  <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                  <span className="text-sm text-gray-600">
                    Klik om favicon te uploaden
                  </span>
                  <p className="text-xs text-gray-500 mt-2">
                    PNG/ICO, 32x32px, max 100KB
                  </p>
                  <input
                    type="file"
                    accept="image/png,image/x-icon"
                    onChange={handleFaviconUpload}
                    className="hidden"
                    disabled={uploading}
                  />
                </label>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Palette className="w-5 h-5" />
          Kleuren
        </h3>

        <div className="flex flex-wrap gap-2 mb-4">
          {Object.keys(PRESET_THEMES).map((presetName) => (
            <button
              key={presetName}
              onClick={() => handlePresetSelect(presetName)}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              {presetName}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Object.entries(colors).map(([key, value]) => (
            <div key={key}>
              <label className="block text-sm font-medium text-gray-700 mb-2 capitalize">
                {key === 'primary' ? 'Primaire Kleur' :
                 key === 'secondary' ? 'Secundaire Kleur' :
                 key === 'accent' ? 'Accent Kleur' :
                 key === 'background' ? 'Achtergrond' : 'Tekst'}
              </label>
              <div className="flex gap-3 items-center">
                <div
                  className="w-12 h-12 rounded-lg border-2 border-gray-300 cursor-pointer"
                  style={{ backgroundColor: value }}
                  onClick={() => {
                    const input = document.getElementById(`color-${key}`) as HTMLInputElement;
                    input?.click();
                  }}
                />
                <input
                  id={`color-${key}`}
                  type="color"
                  value={value}
                  onChange={(e) => handleColorChange(key as keyof ThemeColors, e.target.value)}
                  className="hidden"
                />
                <input
                  type="text"
                  value={value}
                  onChange={(e) => handleColorChange(key as keyof ThemeColors, e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg uppercase"
                  placeholder="#000000"
                />
              </div>
            </div>
          ))}
        </div>

        {!contrastOk && (
          <div className="flex items-start gap-2 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-yellow-800">
              De primaire kleur heeft onvoldoende contrast met de achtergrond. Dit kan de leesbaarheid beïnvloeden.
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
        <h3 className="text-lg font-semibold text-gray-900">Typografie</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Lettertype</label>
            <select
              value={selectedFont}
              onChange={(e) => setSelectedFont(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              style={{ fontFamily: selectedFont }}
            >
              {AVAILABLE_FONTS.map((font) => (
                <option key={font.value} value={font.value} style={{ fontFamily: font.value }}>
                  {font.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Basis Tekstgrootte: {fontSize}px
            </label>
            <input
              type="range"
              min="14"
              max="18"
              value={fontSize}
              onChange={(e) => setFontSize(parseInt(e.target.value))}
              className="w-full"
            />
          </div>
        </div>
      </div>

      {(organization?.subscription_plan === 'business' || organization?.subscription_plan === 'enterprise') && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Globe className="w-5 h-5" />
            Custom Domain
          </h3>
          <p className="text-sm text-gray-600">
            Gebruik je eigen domein (bijvoorbeeld app.jouwbedrijf.nl)
          </p>
          <button
            onClick={() => setShowDomainSetup(true)}
            className="px-4 py-2 bg-brand-primary text-white rounded-lg hover:opacity-90"
          >
            Domain Instellen
          </button>
        </div>
      )}

      <div className="flex gap-3 justify-end sticky bottom-4 bg-white/90 backdrop-blur p-4 rounded-lg border border-gray-200">
        <button
          onClick={() => setShowPreview(true)}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2"
        >
          <Eye className="w-4 h-4" />
          Voorvertoning
        </button>
        <button
          onClick={() => handleSaveTheme(false)}
          disabled={saving}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          Concept Opslaan
        </button>
        <button
          onClick={() => handleSaveTheme(true)}
          disabled={saving}
          className="px-6 py-2 bg-brand-secondary text-white rounded-lg hover:opacity-90 flex items-center gap-2 font-medium"
        >
          <CheckCircle2 className="w-4 h-4" />
          Activeren
        </button>
      </div>

      {showDomainSetup && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowDomainSetup(false);
              setCustomDomain('');
            }
          }}
        >
          <div className="bg-white rounded-xl max-w-2xl w-full p-6 my-8 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Custom Domain Instellen</h3>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Jouw Domein
                </label>
                <input
                  type="text"
                  value={customDomain}
                  onChange={(e) => setCustomDomain(e.target.value)}
                  placeholder="app.jouwbedrijf.nl"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Voer je gewenste subdomain of custom domain in
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
                <h4 className="font-semibold text-blue-900 text-sm">DNS Configuratie</h4>
                <p className="text-sm text-blue-800">
                  Voeg de volgende DNS records toe bij je domein provider:
                </p>

                <div className="space-y-2">
                  <div className="bg-white rounded border border-blue-200 p-3">
                    <div className="grid grid-cols-3 gap-4 text-xs">
                      <div>
                        <div className="text-gray-500 mb-1">Type</div>
                        <div className="font-mono font-semibold">CNAME</div>
                      </div>
                      <div>
                        <div className="text-gray-500 mb-1">Name</div>
                        <div className="font-mono font-semibold">app</div>
                      </div>
                      <div>
                        <div className="text-gray-500 mb-1">Value</div>
                        <div className="font-mono font-semibold">your-app.vercel.app</div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded border border-blue-200 p-3">
                    <div className="grid grid-cols-3 gap-4 text-xs">
                      <div>
                        <div className="text-gray-500 mb-1">Type</div>
                        <div className="font-mono font-semibold">TXT</div>
                      </div>
                      <div>
                        <div className="text-gray-500 mb-1">Name</div>
                        <div className="font-mono font-semibold">_vercel</div>
                      </div>
                      <div>
                        <div className="text-gray-500 mb-1">Value</div>
                        <div className="font-mono font-semibold">vercel-verify={organization?.id}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-semibold text-yellow-900 text-sm mb-2">⚠️ Belangrijk</h4>
                <ul className="text-sm text-yellow-800 space-y-1 list-disc list-inside">
                  <li>DNS wijzigingen kunnen 24-48 uur duren om te propageren</li>
                  <li>Zorg dat je SSL certificaat automatisch wordt aangemaakt</li>
                  <li>Test eerst met een test subdomain voordat je live gaat</li>
                </ul>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 text-sm mb-3">Verificatie Status</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">DNS Records</span>
                    <span className="text-orange-600 font-medium">Wachtend op configuratie</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">SSL Certificaat</span>
                    <span className="text-gray-400 font-medium">Nog niet gestart</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Domain Status</span>
                    <span className="text-gray-400 font-medium">Inactief</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowDomainSetup(false);
                  setCustomDomain('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Sluiten
              </button>
              <button
                onClick={async () => {
                  if (!customDomain.trim()) {
                    alert('Voer een domein in');
                    return;
                  }
                  alert('Domain configuratie opgeslagen! Volg de DNS instructies om je domain te activeren.');
                  setShowDomainSetup(false);
                }}
                className="flex-1 px-4 py-2 bg-brand-primary text-white rounded-lg hover:opacity-90"
              >
                Opslaan & Verifiëren
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
