-- Create party_groups table for group event planning
CREATE TABLE public.party_groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  cover_image TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create party_group_members table
CREATE TABLE public.party_group_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.party_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  joined_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(group_id, user_id)
);

-- Create notification_preferences table for Tonight's Picks
CREATE TABLE public.notification_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  tonights_picks_enabled BOOLEAN DEFAULT true,
  tonights_picks_time TIME DEFAULT '18:00:00',
  weekly_recap_enabled BOOLEAN DEFAULT true,
  friend_activity_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create scheduled_notifications table to track sent notifications
CREATE TABLE public.scheduled_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  event_ids UUID[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}'
);

-- Enable RLS
ALTER TABLE public.party_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.party_group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduled_notifications ENABLE ROW LEVEL SECURITY;

-- Party groups policies
CREATE POLICY "Users can view groups they're part of"
ON public.party_groups FOR SELECT
USING (
  created_by = auth.uid() OR
  EXISTS (SELECT 1 FROM public.party_group_members WHERE group_id = id AND user_id = auth.uid() AND status = 'accepted')
);

CREATE POLICY "Users can create groups"
ON public.party_groups FOR INSERT
WITH CHECK (created_by = auth.uid());

CREATE POLICY "Group creators can update their groups"
ON public.party_groups FOR UPDATE
USING (created_by = auth.uid());

CREATE POLICY "Group creators can delete their groups"
ON public.party_groups FOR DELETE
USING (created_by = auth.uid());

-- Party group members policies
CREATE POLICY "Members can view group members"
ON public.party_group_members FOR SELECT
USING (
  user_id = auth.uid() OR
  EXISTS (SELECT 1 FROM public.party_groups WHERE id = group_id AND created_by = auth.uid()) OR
  EXISTS (SELECT 1 FROM public.party_group_members m WHERE m.group_id = group_id AND m.user_id = auth.uid() AND m.status = 'accepted')
);

CREATE POLICY "Group admins can invite members"
ON public.party_group_members FOR INSERT
WITH CHECK (
  EXISTS (SELECT 1 FROM public.party_groups WHERE id = group_id AND created_by = auth.uid()) OR
  EXISTS (SELECT 1 FROM public.party_group_members WHERE group_id = party_group_members.group_id AND user_id = auth.uid() AND role = 'admin' AND status = 'accepted')
);

CREATE POLICY "Users can update their own membership"
ON public.party_group_members FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "Admins can remove members"
ON public.party_group_members FOR DELETE
USING (
  user_id = auth.uid() OR
  EXISTS (SELECT 1 FROM public.party_groups WHERE id = group_id AND created_by = auth.uid())
);

-- Notification preferences policies
CREATE POLICY "Users can view own notification preferences"
ON public.notification_preferences FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can insert own notification preferences"
ON public.notification_preferences FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own notification preferences"
ON public.notification_preferences FOR UPDATE
USING (user_id = auth.uid());

-- Scheduled notifications policies
CREATE POLICY "Users can view own scheduled notifications"
ON public.scheduled_notifications FOR SELECT
USING (user_id = auth.uid());

-- Create indexes for performance
CREATE INDEX idx_party_group_members_group_id ON public.party_group_members(group_id);
CREATE INDEX idx_party_group_members_user_id ON public.party_group_members(user_id);
CREATE INDEX idx_party_groups_event_id ON public.party_groups(event_id);
CREATE INDEX idx_scheduled_notifications_user_type ON public.scheduled_notifications(user_id, notification_type);
CREATE INDEX idx_scheduled_notifications_sent_at ON public.scheduled_notifications(sent_at);

-- Trigger for updated_at
CREATE TRIGGER update_party_groups_updated_at
BEFORE UPDATE ON public.party_groups
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_notification_preferences_updated_at
BEFORE UPDATE ON public.notification_preferences
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();