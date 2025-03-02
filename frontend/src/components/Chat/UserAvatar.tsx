import React from 'react';

interface UserAvatarProps {
  user: {
    username: string;
    avatarUrl?: string;
  };
  size?: 'sm' | 'md' | 'lg';
}

const UserAvatar: React.FC<UserAvatarProps> = ({ user, size = 'md' }) => {
  const sizeClasses = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-12 w-12 text-base',
  };

  const initials = user.username
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  if (user.avatarUrl) {
    return (
      <img
        src={user.avatarUrl}
        alt={user.username}
        className={`${sizeClasses[size]} rounded-full object-cover`}
      />
    );
  }

  return (
    <div
      className={`${sizeClasses[size]} rounded-full bg-blue-600 flex items-center justify-center text-white font-medium`}
    >
      {initials}
    </div>
  );
};

export default UserAvatar;