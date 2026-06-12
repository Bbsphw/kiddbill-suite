// web/src/components/join-bill-dialog.tsx

"use client";

import { useState } from "react";
import { useJoinBill } from "@/hooks/use-join-bill"; // Ensure hook path is correct
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { LogIn, Loader2, Keyboard } from "lucide-react";

export function JoinBillCard() {
  const [code, setCode] = useState("");
  const joinMutation = useJoinBill();
  const handleJoin = () => {
    if (code.length === 6) joinMutation.mutate(code);
  };

  return (
    <Card className="border-none shadow-none bg-transparent">
      <CardHeader className="pb-2 px-0 pt-0">
        <div className="flex items-center gap-2 text-indigo-600 mb-1">
          <div className="p-2 bg-indigo-50 rounded-lg">
            <Keyboard size={20} />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider">
            Join via Code
          </span>
        </div>
        <CardTitle className="text-lg text-slate-900">เข้าร่วมบิล</CardTitle>
        <CardDescription>กรอกรหัส 6 หลักที่ได้จากเพื่อน</CardDescription>
      </CardHeader>
      <CardContent className="px-0">
        <div className="flex gap-2">
          <Input
            placeholder="A8X9K2"
            className="uppercase tracking-widest font-mono text-center font-bold text-lg h-12 rounded-xl border-slate-200 focus:border-indigo-500 focus:ring-indigo-200"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase().replace(/\s/g, ""))}
            onKeyDown={(e) => e.key === "Enter" && handleJoin()}
            disabled={joinMutation.isPending}
          />
          <Button
            onClick={handleJoin}
            disabled={code.length !== 6 || joinMutation.isPending}
            className="bg-indigo-600 hover:bg-indigo-700 min-w-[60px] h-12 rounded-xl shadow-md shadow-indigo-200"
          >
            {joinMutation.isPending ? (
              <Loader2 className="animate-spin" />
            ) : (
              <LogIn size={20} />
            )}
          </Button>
        </div>
        <p className="text-xs text-slate-400 mt-3 text-center bg-slate-50 py-2 rounded-lg">
          รหัส join code ดูได้จากหัวบิลของเพื่อน
        </p>
      </CardContent>
    </Card>
  );
}
