interface UserAvatarProps {
  avatarUrl?: string | null;
  name: string;
  size?: number;
}

export function UserAvatar({ avatarUrl, name, size = 24 }: UserAvatarProps) {
  const initials = (name || '?').trim().charAt(0).toUpperCase();
  const hue = (name.charCodeAt(0) * 17) % 360;
  const background = `linear-gradient(135deg, hsl(${hue}, 55%, 45%), hsl(${(hue + 60) % 360}, 60%, 30%))`;

  if (avatarUrl) {
    const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:2998';
    const src = avatarUrl.startsWith('http')
      ? avatarUrl
      : `${apiUrl}${avatarUrl}`;

    return (
      <div
        className="relative isolate shrink-0 overflow-hidden rounded-full"
        style={{ width: size, height: size, background }}
      >
        <img src={src} alt={name} className="h-full w-full object-cover" />
      </div>
    );
  }

  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full font-bold tracking-[-0.02em] text-white/92"
      style={{
        width: size,
        height: size,
        background,
        fontSize: size * 0.42,
      }}
    >
      {initials}
    </div>
  );
}
