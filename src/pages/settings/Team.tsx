import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Crown, Shield, TrendingUp, MapPin, Phone, Target, User, Eye, MoreVertical, Trash2, Mail, Clock } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useOrganization } from '../../contexts/OrganizationContext';
import { ROLE_COLORS, Role } from '../../lib/permissions';
import { RoleSelector } from '../../components/team/RoleSelector';

interface TeamMember {
  id: string;
  user_id: string;
  role: Role;
  is_active: boolean;
  joined_at: string;
  user_profile: {
    contact_name: string;
    email: string;
  };
}

interface TeamInvite {
  id: string;
  email: string;
  role: Role;
  invited_by_profile: {
    contact_name: string;
  };
  expires_at: string;
  created_at: string;
}

export function Team() {
  const { organization, currentMember, can } = useOrganization();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [invites, setInvites] = useState<TeamInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<Role>('employee');
  const [inviting, setInviting] = useState(false);
  const [inviteLink, setInviteLink] = useState('');

  useEffect(() => {
    if (organization) {
      loadMembers();
      loadInvites();
    }
  }, [organization]);

  const loadMembers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('team_members')
        .select(`
          *,
          user_profile:user_profiles!team_members_user_id_fkey(contact_name, email)
        `)
        .eq('organization_id', organization!.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMembers(data || []);
    } catch (error) {
      console.error('Error loading members:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadInvites = async () => {
    try {
      const { data, error } = await supabase
        .from('team_invites')
        .select(`
          *,
          invited_by_profile:user_profiles!team_invites_invited_by_fkey(contact_name)
        `)
        .eq('organization_id', organization!.id)
        .is('accepted_at', null)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInvites(data || []);
    } catch (error) {
      console.error('Error loading invites:', error);
    }
  };

  const handleInvite = async () => {
    if (!inviteEmail.trim() || !organization) return;

    setInviting(true);
    try {
      const token = crypto.randomUUID();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase.from('team_invites').insert({
        organization_id: organization.id,
        email: inviteEmail,
        role: inviteRole,
        invited_by: user!.id,
        token,
        expires_at: expiresAt.toISOString(),
      });

      if (error) throw error;

      const link = `${window.location.origin}/accept-invite?token=${token}`;
      setInviteLink(link);

      // Send email via Edge Function
      try {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('contact_name')
          .eq('user_id', user!.id)
          .single();

        const { data: session } = await supabase.auth.getSession();

        console.log('Sending invite email to:', inviteEmail);

        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-invite-email`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.session?.access_token}`,
            },
            body: JSON.stringify({
              to: inviteEmail,
              inviterName: profile?.contact_name || 'Een teamlid',
              organizationName: organization.name,
              role: inviteRole,
              inviteLink: link,
            }),
          }
        );

        const responseData = await response.json();

        if (!response.ok) {
          console.error('Failed to send email:', responseData);
          alert(`⚠️ Email kon niet worden verstuurd: ${responseData.error || 'Onbekende fout'}\n\nControleer je Resend configuratie. De uitnodigingslink is wel aangemaakt en kun je handmatig delen.`);
        } else {
          console.log('Email sent successfully:', responseData);
        }
      } catch (emailError: any) {
        console.error('Error sending email:', emailError);
        alert(`⚠️ Email verzenden mislukt: ${emailError.message}\n\nControleer of RESEND_API_KEY is geconfigureerd in Supabase. De uitnodigingslink is wel aangemaakt en kun je handmatig delen.`);
      }

      loadInvites();
    } catch (error: any) {
      console.error('Error sending invite:', error);
      alert('Fout bij versturen uitnodiging: ' + error.message);
    } finally {
      setInviting(false);
    }
  };

  const handleRevokeInvite = async (inviteId: string) => {
    if (!confirm('Weet je zeker dat je deze uitnodiging wilt intrekken?')) return;

    try {
      const { error } = await supabase
        .from('team_invites')
        .delete()
        .eq('id', inviteId);

      if (error) throw error;
      loadInvites();
    } catch (error) {
      console.error('Error revoking invite:', error);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm('Weet je zeker dat je dit teamlid wilt verwijderen?')) return;

    try {
      const { error } = await supabase
        .from('team_members')
        .update({ is_active: false })
        .eq('id', memberId);

      if (error) throw error;
      loadMembers();
    } catch (error) {
      console.error('Error removing member:', error);
    }
  };

  const getRoleIcon = (role: Role) => {
    switch (role) {
      case 'owner': return <Crown className="w-4 h-4" />;
      case 'admin': return <Shield className="w-4 h-4" />;
      case 'head_of_sales': return <TrendingUp className="w-4 h-4" />;
      case 'sales_manager': return <Users className="w-4 h-4" />;
      case 'account_manager_field': return <MapPin className="w-4 h-4" />;
      case 'commercial_inside': return <Phone className="w-4 h-4" />;
      case 'field_marketeer': return <Target className="w-4 h-4" />;
      case 'employee': return <User className="w-4 h-4" />;
      case 'viewer': return <Eye className="w-4 h-4" />;
    }
  };

  const getTimeAgo = (date: string) => {
    const now = new Date();
    const past = new Date(date);
    const diffInMonths = Math.floor((now.getTime() - past.getTime()) / (1000 * 60 * 60 * 24 * 30));
    if (diffInMonths < 1) return 'Deze maand';
    return `${diffInMonths} ${diffInMonths === 1 ? 'maand' : 'maanden'} geleden`;
  };

  if (!can('team', 'read')) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Je hebt geen toegang tot team management</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Team</h2>
        <p className="text-gray-600 mt-1">Beheer je teamleden en uitnodigingen</p>
      </div>

      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{organization?.name}</h3>
            <div className="flex items-center gap-3 mt-2">
              <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                {organization?.subscription_plan}
              </span>
              <span className="text-sm text-gray-600">
                {members.length} van {organization?.max_users} gebruikers
              </span>
            </div>
          </div>
          {can('team', 'invite') && (
            <button
              onClick={() => setShowInviteModal(true)}
              className="px-4 py-2 bg-brand-primary text-white rounded-lg hover:opacity-90 transition flex items-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              Teamlid Uitnodigen
            </button>
          )}
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl">
        <div className="p-4 border-b">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <Users className="w-5 h-5" />
            Teamleden ({members.length})
          </h3>
        </div>

        <div className="divide-y">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Laden...</div>
          ) : members.length === 0 ? (
            <div className="p-8 text-center text-gray-500">Geen teamleden gevonden</div>
          ) : (
            members.map((member) => {
              const roleColor = ROLE_COLORS[member.role];
              return (
                <div key={member.id} className="p-4 hover:bg-gray-50 transition">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-semibold">
                        {member.user_profile?.contact_name?.charAt(0) || 'U'}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{member.user_profile?.contact_name || 'Onbekend'}</div>
                        <div className="text-sm text-gray-500">{member.user_profile?.email}</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1.5 ${roleColor.bg} ${roleColor.text}`}>
                          {getRoleIcon(member.role)}
                          {roleColor.label}
                        </span>
                        <span className="text-sm text-gray-500 flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          Lid sinds {getTimeAgo(member.joined_at)}
                        </span>
                      </div>
                    </div>
                    {can('team', 'manage') && member.role !== 'owner' && member.user_id !== currentMember?.user_id && (
                      <button
                        onClick={() => handleRemoveMember(member.id)}
                        className="p-2 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-600 transition ml-2"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {invites.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl">
          <div className="p-4 border-b">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <Mail className="w-5 h-5" />
              Openstaande Uitnodigingen ({invites.length})
            </h3>
          </div>

          <div className="divide-y">
            {invites.map((invite) => {
              const roleColor = ROLE_COLORS[invite.role];
              const daysLeft = Math.ceil((new Date(invite.expires_at).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

              return (
                <div key={invite.id} className="p-4 hover:bg-gray-50 transition">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{invite.email}</div>
                      <div className="text-sm text-gray-500 mt-1">
                        Uitgenodigd door {invite.invited_by_profile?.contact_name} • Verloopt over {daysLeft} dagen
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${roleColor.bg} ${roleColor.text}`}>
                        {roleColor.label}
                      </span>
                      {can('team', 'manage') && (
                        <button
                          onClick={() => handleRevokeInvite(invite.id)}
                          className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition"
                        >
                          Intrekken
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {showInviteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6 my-8 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Teamlid Uitnodigen</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="collega@example.com"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  disabled={!!inviteLink}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Rol</label>
                <RoleSelector
                  value={inviteRole}
                  onChange={setInviteRole}
                  showOnboarding={true}
                  disabled={!!inviteLink}
                />
              </div>

              {inviteLink && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-start gap-2 mb-2">
                    <Mail className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-green-900">Uitnodiging aangemaakt!</p>
                      <p className="text-sm text-green-700 mt-1">
                        Een email is verstuurd naar {inviteEmail}. Als de email niet aankomt, kun je de onderstaande link handmatig delen.
                      </p>
                    </div>
                  </div>
                  <div className="mt-3">
                    <label className="block text-xs font-medium text-green-900 mb-1">Uitnodigingslink:</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={inviteLink}
                        readOnly
                        className="flex-1 px-3 py-2 bg-white border border-green-300 rounded text-sm"
                      />
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(inviteLink);
                          alert('Link gekopieerd!');
                        }}
                        className="px-3 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                      >
                        Kopieer
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6 sticky bottom-0 bg-white pt-4 border-t">
              <button
                onClick={() => {
                  setShowInviteModal(false);
                  setInviteEmail('');
                  setInviteRole('employee');
                  setInviteLink('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                {inviteLink ? 'Sluiten' : 'Annuleren'}
              </button>
              {!inviteLink && (
                <button
                  onClick={handleInvite}
                  disabled={inviting || !inviteEmail.trim()}
                  className="flex-1 px-4 py-2 bg-brand-primary text-white rounded-lg hover:opacity-90 disabled:opacity-50"
                >
                  {inviting ? 'Bezig...' : 'Verstuur Uitnodiging'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
