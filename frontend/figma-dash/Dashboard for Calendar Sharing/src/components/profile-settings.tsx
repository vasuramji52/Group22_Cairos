import React, { useEffect, useState } from "react";
import { User, Mail, Globe, LogOut, Save } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";
import { EgyptianBorder, PapyrusCard, AnkhIcon } from "./egyptian-decorations";
import { getMe, updateProfile, logout, type User as UserType } from "../lib/mock-api";
import { toast } from "sonner@2.0.3";

interface ProfileSettingsProps {
  onLogout: () => void;
}

export function ProfileSettings({ onLogout }: ProfileSettingsProps) {
  const [user, setUser] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    timezone: "",
  });

  useEffect(() => {
    loadUser();
  }, []);

  async function loadUser() {
    try {
      const userData = await getMe();
      setUser(userData);
      setFormData({
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        timezone: userData.timezone,
      });
    } catch (error) {
      console.error("Failed to load user:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      const updated = await updateProfile(formData);
      setUser(updated);
      toast.success("Profile updated successfully!");
    } catch (error) {
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  }

  async function handleLogout() {
    try {
      await logout();
      toast.success("Logged out successfully");
      onLogout();
    } catch (error) {
      toast.error("Failed to logout");
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-[#1B4B5A] to-[#2C6E7E]">
        <div className="text-[#D4AF37]">Loading...</div>
      </div>
    );
  }

  const hasChanges =
    user &&
    (formData.firstName !== user.firstName ||
      formData.lastName !== user.lastName ||
      formData.email !== user.email ||
      formData.timezone !== user.timezone);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1B4B5A] to-[#2C6E7E] p-6">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <User className="w-10 h-10 text-[#D4AF37]" />
            <div>
              <h1 className="text-[#D4AF37] tracking-wide">Profile & Settings</h1>
              <p className="text-[#C5A572]">Manage your account preferences</p>
            </div>
          </div>
          <EgyptianBorder className="my-4" />
        </div>

        {/* Profile Information */}
        <PapyrusCard className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[#1B4B5A]">
              <User className="w-5 h-5" />
              Personal Information
            </CardTitle>
            <CardDescription className="text-[#2C6E7E]">
              Update your personal details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName" className="text-[#1B4B5A]">
                  First Name
                </Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="bg-white border-[#D4AF37]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName" className="text-[#1B4B5A]">
                  Last Name
                </Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="bg-white border-[#D4AF37]"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-[#1B4B5A] flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="bg-white border-[#D4AF37]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="timezone" className="text-[#1B4B5A] flex items-center gap-2">
                <Globe className="w-4 h-4" />
                Timezone
              </Label>
              <Input
                id="timezone"
                value={formData.timezone}
                onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                className="bg-white border-[#D4AF37]"
                placeholder="America/New_York"
              />
              <p className="text-[#C5A572]">
                Your current timezone: {Intl.DateTimeFormat().resolvedOptions().timeZone}
              </p>
            </div>
            <Button
              onClick={handleSave}
              disabled={!hasChanges || saving}
              className="bg-[#1B4B5A] hover:bg-[#2C6E7E] text-[#D4AF37] border-2 border-[#D4AF37]"
            >
              <Save className="w-4 h-4 mr-2" />
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </CardContent>
        </PapyrusCard>

        {/* Connected Accounts */}
        <PapyrusCard className="mb-6">
          <CardHeader>
            <CardTitle className="text-[#1B4B5A]">Connected Accounts</CardTitle>
            <CardDescription className="text-[#2C6E7E]">
              Manage your connected calendar services
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-[#D4AF37]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center text-white">
                  G
                </div>
                <div>
                  <p className="text-[#1B4B5A]">Google Calendar</p>
                  <p className="text-[#2C6E7E]">
                    {user?.google.connected ? "Connected" : "Not connected"}
                  </p>
                </div>
              </div>
              {user?.google.connected ? (
                <div className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full">
                  Active
                </div>
              ) : (
                <Button
                  variant="outline"
                  className="border-[#D4AF37] text-[#1B4B5A]"
                >
                  Connect
                </Button>
              )}
            </div>
          </CardContent>
        </PapyrusCard>

        {/* Account Actions */}
        <PapyrusCard className="mb-6">
          <CardHeader>
            <CardTitle className="text-[#1B4B5A]">Account Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              variant="outline"
              className="w-full justify-start border-[#C5A572] text-[#2C6E7E] hover:bg-[#F5E6D3]"
            >
              Change Password
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowLogoutDialog(true)}
              className="w-full justify-start border-[#C1440E] text-[#C1440E] hover:bg-red-50"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </CardContent>
        </PapyrusCard>

        {/* App Info */}
        <div className="text-center space-y-2">
          <AnkhIcon className="w-8 h-8 mx-auto text-[#D4AF37]" />
          <p className="text-[#C5A572]">Cairos - Find Your Perfect Moment</p>
          <p className="text-[#C5A572]">Version 1.0.0</p>
        </div>
      </div>

      {/* Logout Confirmation Dialog */}
      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent className="bg-[#F5E6D3] border-2 border-[#D4AF37]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[#1B4B5A]">Logout?</AlertDialogTitle>
            <AlertDialogDescription className="text-[#2C6E7E]">
              Are you sure you want to logout? You'll need to sign in again to access your account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white border-[#C5A572] text-[#2C6E7E]">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLogout}
              className="bg-[#C1440E] hover:bg-[#C1440E]/90 text-white"
            >
              Logout
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
