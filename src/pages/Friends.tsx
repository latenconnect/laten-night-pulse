import React from 'react';
import MobileLayout from '@/components/layouts/MobileLayout';
import MobileHeader from '@/components/MobileHeader';
import FriendsSearch from '@/components/friends/FriendsSearch';

const Friends: React.FC = () => {
  return (
    <MobileLayout>
      <MobileHeader title="Friends" showBack />
      <div className="px-4 py-4 pb-24">
        <FriendsSearch />
      </div>
    </MobileLayout>
  );
};

export default Friends;
