"use client";

import { useState } from "react";

interface MemberRowProps {
  readonly id: string;
  readonly teamId: string;
  readonly email: string;
  readonly role: string;
  readonly acceptedAt: string | null;
  readonly isAdmin: boolean;
  readonly currentUserId: string;
  readonly userId: string | null;
}

const ROLE_COLORS: Record<string, string> = {
  admin: "bg-amber-100 text-amber-700",
  member: "bg-blue-100 text-blue-700",
  viewer: "bg-sand-100 text-sand-500",
};

export function MemberRow({
  id,
  teamId,
  email,
  role,
  acceptedAt,
  isAdmin,
  currentUserId,
  userId,
}: MemberRowProps) {
  const [currentRole, setCurrentRole] = useState(role);
  const [removing, setRemoving] = useState(false);

  const isPending = acceptedAt === null;
  const isSelf = userId === currentUserId;

  async function handleRoleChange(newRole: string) {
    setCurrentRole(newRole);
    await fetch(`/api/teams/${teamId}/members/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: newRole }),
    });
  }

  async function handleRemove() {
    setRemoving(true);
    const res = await fetch(`/api/teams/${teamId}/members/${id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      window.location.reload();
    } else {
      setRemoving(false);
    }
  }

  return (
    <tr className="border-b border-sand-100 last:border-b-0">
      <td className="py-3 pr-4 text-sm text-sand-900">{email}</td>
      <td className="py-3 pr-4">
        <span
          className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full ${ROLE_COLORS[currentRole] ?? ROLE_COLORS.viewer}`}
        >
          {currentRole}
        </span>
      </td>
      <td className="py-3 pr-4 text-sm">
        {isPending ? (
          <span className="text-amber-600">Pending</span>
        ) : (
          <span className="text-emerald-600">Active</span>
        )}
      </td>
      <td className="py-3 text-right">
        {isAdmin && !isSelf && (
          <div className="flex items-center justify-end gap-2">
            <select
              value={currentRole}
              onChange={(e) => handleRoleChange(e.target.value)}
              className="text-xs border border-sand-200 rounded px-1.5 py-1 text-sand-700 bg-white"
            >
              <option value="admin">admin</option>
              <option value="member">member</option>
              <option value="viewer">viewer</option>
            </select>
            <button
              type="button"
              onClick={handleRemove}
              disabled={removing}
              className="text-xs text-red-600 hover:text-red-800 font-medium disabled:opacity-50"
            >
              {removing ? "Removing..." : "Remove"}
            </button>
          </div>
        )}
      </td>
    </tr>
  );
}
