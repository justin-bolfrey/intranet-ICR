"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateMemberRole, type AdminMemberRow } from "@/app/(intranet)/admin/members/actions";

const ROLE_LABELS: Record<string, string> = {
  member: "Mitglied",
  admin: "Admin",
  board: "Vorstand",
};

type Props = {
  member: AdminMemberRow;
};

export function MemberRoleSelect({ member }: Props) {
  const [value, setValue] = useState(member.rolle);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleChange(newRole: string) {
    setLoading(true);
    try {
      const { error } = await updateMemberRole(member.id, newRole);
      if (error) toast.error(error);
      else {
        setValue(newRole);
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Select
      value={value || "member"}
      onValueChange={handleChange}
      disabled={loading}
    >
      <SelectTrigger className="w-[130px]" size="sm">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="member">{ROLE_LABELS.member}</SelectItem>
        <SelectItem value="admin">{ROLE_LABELS.admin}</SelectItem>
        <SelectItem value="board">{ROLE_LABELS.board}</SelectItem>
      </SelectContent>
    </Select>
  );
}
