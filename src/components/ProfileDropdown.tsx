import { useState } from 'react';
import { User, LogOut, Settings, Mail, Calendar, Edit2, Check, X, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useProfile } from '@/hooks/useProfile';
import { useAdminRole } from '@/hooks/useAdminRole';
import { format } from 'date-fns';

interface ProfileDropdownProps {
  user: {
    id: string;
    email?: string;
  };
  onSignOut: () => void;
}

export function ProfileDropdown({ user, onSignOut }: ProfileDropdownProps) {
  const { profile, updateProfile, isLoading } = useProfile(user.id);
  const { isAdmin } = useAdminRole(user.id);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const displayName = profile?.display_name || 'User';
  const userEmail = user.email || 'No email';
  
  // Get initials for avatar
  const getInitials = () => {
    if (profile?.display_name) {
      const names = profile.display_name.split(' ');
      if (names.length >= 2) {
        return `${names[0][0]}${names[1][0]}`.toUpperCase();
      }
      return profile.display_name.slice(0, 2).toUpperCase();
    }
    return userEmail[0].toUpperCase();
  };

  const handleEditClick = () => {
    setEditName(profile?.display_name || '');
    setIsEditDialogOpen(true);
  };

  const handleSave = async () => {
    if (!editName.trim()) return;
    
    setIsSaving(true);
    const result = await updateProfile({ display_name: editName.trim() });
    setIsSaving(false);
    
    if (result.success) {
      setIsEditDialogOpen(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="flex items-center gap-2 h-auto py-2">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary text-primary-foreground">
                {getInitials()}
              </AvatarFallback>
            </Avatar>
            <div className="hidden md:flex flex-col items-start">
              <span className="text-sm font-medium">{displayName}</span>
              <span className="text-xs text-muted-foreground">{userEmail}</span>
            </div>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-72">
          <DropdownMenuLabel className="font-normal">
            <div className="flex items-start gap-3 p-2">
              <Avatar className="h-12 w-12">
                <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-1">
                <p className="text-base font-semibold leading-none">{displayName}</p>
                <p className="text-sm text-muted-foreground">{userEmail}</p>
                {profile?.created_at && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-2">
                    <Calendar className="h-3 w-3" />
                    Joined {format(new Date(profile.created_at), 'MMM d, yyyy')}
                  </p>
                )}
              </div>
            </div>
          </DropdownMenuLabel>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem onClick={handleEditClick} className="cursor-pointer">
            <Edit2 className="mr-2 h-4 w-4" />
            <span>Edit Profile</span>
          </DropdownMenuItem>
          
          {isAdmin && (
            <DropdownMenuItem asChild className="cursor-pointer">
              <Link to="/admin" className="flex items-center">
                <Shield className="mr-2 h-4 w-4 text-primary" />
                <span>Admin Dashboard</span>
              </Link>
            </DropdownMenuItem>
          )}
          
          <DropdownMenuItem className="cursor-default focus:bg-transparent">
            <Mail className="mr-2 h-4 w-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground truncate">{userEmail}</span>
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem onClick={onSignOut} className="cursor-pointer text-destructive focus:text-destructive">
            <LogOut className="mr-2 h-4 w-4" />
            <span>Sign out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Edit Profile Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
            <DialogDescription>
              Update your display name and profile information
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="display-name">Display Name</Label>
              <Input
                id="display-name"
                placeholder="Enter your name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                disabled={isSaving}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={userEmail} disabled className="bg-muted" />
              <p className="text-xs text-muted-foreground">
                Email cannot be changed
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
              disabled={isSaving}
            >
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving || !editName.trim()}>
              {isSaving ? (
                <>
                  <span className="mr-2">Saving...</span>
                </>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
