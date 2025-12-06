import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { Role, TestRole, getPermissions, Permissions, getBaseRole, canSwitchToTestMode } from '../lib/permissions';

interface Organization {
  id: string;
  name: string;
  owner_id: string;
  subscription_plan: string;
  max_users: number;
  settings: any;
}

interface TeamMember {
  id: string;
  user_id: string;
  organization_id: string;
  role: Role;
  permissions: Partial<Permissions>;
  is_active: boolean;
  joined_at: string;
}

interface OrganizationContextType {
  organization: Organization | null;
  currentMember: TeamMember | null;
  permissions: Permissions | null;
  loading: boolean;
  refreshOrganization: () => Promise<void>;
  can: (resource: keyof Permissions, action: string) => boolean;
  activeTestRole: TestRole | null;
  effectiveRole: Role;
  switchToTestRole: (testRole: TestRole) => void;
  switchBackFromTestRole: () => void;
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

export function OrganizationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [currentMember, setCurrentMember] = useState<TeamMember | null>(null);
  const [permissions, setPermissions] = useState<Permissions | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTestRole, setActiveTestRole] = useState<TestRole | null>(null);
  const [effectiveRole, setEffectiveRole] = useState<Role>('viewer');

  const loadOrganization = async () => {
    if (!user) {
      setOrganization(null);
      setCurrentMember(null);
      setPermissions(null);
      setLoading(false);
      return;
    }

    try {
      const { data: memberData, error: memberError } = await supabase
        .from('team_members')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle();

      if (memberError) throw memberError;

      if (memberData) {
        setCurrentMember(memberData);

        // Fetch organization separately to avoid RLS recursion
        const { data: orgData, error: orgError } = await supabase
          .from('organizations')
          .select('*')
          .eq('id', memberData.organization_id)
          .single();

        if (orgError) throw orgError;
        setOrganization(orgData);

        const currentEffectiveRole = activeTestRole ? getBaseRole(activeTestRole) : (memberData.role as Role);
        setEffectiveRole(currentEffectiveRole);
        const perms = getPermissions(currentEffectiveRole, memberData.permissions);
        setPermissions(perms);
      } else {
        const { data: newOrg, error: orgError } = await supabase
          .from('organizations')
          .insert({
            name: user.email?.split('@')[0] + "'s Bedrijf",
            owner_id: user.id,
            subscription_plan: 'starter',
            max_users: 5,
          })
          .select()
          .single();

        if (orgError) throw orgError;

        const { data: newMember, error: newMemberError } = await supabase
          .from('team_members')
          .insert({
            user_id: user.id,
            organization_id: newOrg.id,
            role: 'owner',
            is_active: true,
          })
          .select()
          .single();

        if (newMemberError) throw newMemberError;

        setOrganization(newOrg);
        setCurrentMember(newMember);
        setEffectiveRole('owner');
        setPermissions(getPermissions('owner'));
      }
    } catch (error) {
      console.error('Error loading organization:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrganization();
  }, [user, activeTestRole]);

  const switchToTestRole = (testRole: TestRole) => {
    if (!currentMember || !canSwitchToTestMode(currentMember.role)) {
      console.warn('Cannot switch to test role: insufficient permissions');
      return;
    }
    setActiveTestRole(testRole);
  };

  const switchBackFromTestRole = () => {
    setActiveTestRole(null);
  };

  const can = (resource: keyof Permissions, action: string): boolean => {
    if (!permissions) return false;

    const resourcePerms = permissions[resource];
    if (!resourcePerms) return false;

    if (typeof resourcePerms === 'object' && action in resourcePerms) {
      const value = resourcePerms[action as keyof typeof resourcePerms];
      // Handle different permission value types
      if (value === true) return true;
      if (value === 'all' || value === 'team' || value === 'own') return true;
      return false;
    }

    return false;
  };

  return (
    <OrganizationContext.Provider
      value={{
        organization,
        currentMember,
        permissions,
        loading,
        refreshOrganization: loadOrganization,
        can,
        activeTestRole,
        effectiveRole,
        switchToTestRole,
        switchBackFromTestRole,
      }}
    >
      {children}
    </OrganizationContext.Provider>
  );
}

export function useOrganization() {
  const context = useContext(OrganizationContext);
  if (context === undefined) {
    throw new Error('useOrganization must be used within an OrganizationProvider');
  }
  return context;
}
