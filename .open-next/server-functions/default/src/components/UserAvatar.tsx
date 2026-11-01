export default function UserAvatar({
  user,
  label,
  className = "h-12 w-12",
  rounded = "rounded-2xl",
}: {
  user?: {
    id?: number;
    fullName?: string;
    name?: string;
    avatarName?: string;
  } | null;
  label?: string;
  className?: string;
  rounded?: string;
}) {
  const name = user?.fullName || user?.name || label || "کاربر";
  const src =
    user?.id && user.avatarName
      ? `/api/avatar?userId=${user.id}&v=${encodeURIComponent(user.avatarName)}`
      : "";

  return (
    <div
      className={`shrink-0 overflow-hidden border border-gray-200 bg-gray-100 ${rounded} ${className}`}
    >
      {src ? (
        <img
          src={src}
          alt={name}
          className="h-full w-full object-cover"
          loading="lazy"
        />
      ) : (
        <div className="grid h-full w-full place-items-center bg-gradient-to-br from-[#003b5c] to-[#00a8e8] text-sm font-bold text-white">
          {name.trim().charAt(0) || "👤"}
        </div>
      )}
    </div>
  );
}
