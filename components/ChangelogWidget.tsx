"use client";

import { useState } from "react";
import { GitCommit, Terminal, Calendar, Code, Copy, Check, ChevronDown, ChevronUp } from "lucide-react";

interface ChangelogEntry {
  version: string;
  date: string;
  title: string;
  description: string;
  changes: string[];
  sql?: string;
}

export default function ChangelogWidget() {
  const [expandedVersion, setExpandedVersion] = useState<string | null>("v1.0.4");
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const changelogs: ChangelogEntry[] = [
    {
      version: "v1.0.4",
      date: "2026-06-28",
      title: "Kakao OAuth Virtual Email Bypass & Password guards",
      description: "Kakao login failing on KOE205 scope configuration issues has been resolved via an automatic database-level virtual email bypass. Front-end blocks and alerts prevent these virtual email accounts from altering or resetting passwords.",
      changes: [
        "Updated database trigger handle_new_user() to detect null emails and generate a unique virtual email format (kakao_[id]@cse4seoul.kakao).",
        "Added validation check in login page to intercept and reject password reset requests for Kakao virtual domains.",
        "Integrated client-side check on password reset and update pages to block submittal for Kakao login users.",
        "Reverted temporary frontend blocks to enable standard OAuth login sequence."
      ],
      sql: `-- Supabase SQL: Generate Virtual Email on NULL Email Signups (Kakao Bypass)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_email TEXT;
BEGIN
  v_email := NEW.email;
  
  -- If email is missing (NULL or empty), generate a virtual email
  IF v_email IS NULL OR v_email = '' THEN
    IF (NEW.raw_app_meta_data->>'provider' = 'kakao') OR (NEW.raw_user_meta_data->>'iss' LIKE '%kakao%') THEN
      v_email := 'kakao_' || COALESCE(NEW.raw_user_meta_data->>'sub', NEW.id::text) || '@cse4seoul.kakao';
    ELSE
      v_email := 'user_' || NEW.id::text || '@cse4seoul.placeholder';
    END IF;
  END IF;

  INSERT INTO public.profiles (id, email, is_consented, consented_at, role)
  VALUES (
    NEW.id, 
    v_email, 
    COALESCE((NEW.raw_user_meta_data->>'is_consented')::boolean, false),
    (NEW.raw_user_meta_data->>'consented_at')::timestamptz,
    'outsider'
  )
  ON CONFLICT (id) DO UPDATE
  SET 
    email = EXCLUDED.email,
    is_consented = COALESCE(EXCLUDED.is_consented, profiles.is_consented),
    consented_at = COALESCE(EXCLUDED.consented_at, profiles.consented_at);
  RETURN NEW;
END;
$$;`
    },
    {
      version: "v1.0.3",
      date: "2026-06-28",
      title: "TSConfig Cleanups",
      description: "Optimized typescript configurations for compatibility with modern TS 7.0 standards.",
      changes: [
        "Removed deprecated 'baseUrl' configuration option from tsconfig.json to prevent compilation errors under future modules."
      ]
    },
    {
      version: "v1.0.2",
      date: "2026-02-15",
      title: "Role Tampering Prevention Trigger",
      description: "Added a database level security block to prevent client-side role manipulation in the profiles table.",
      changes: [
        "Created database trigger tr_prevent_role_change executing on public.profiles before updates.",
        "Throws exception if an unauthorized user attempts to change role levels or the admin flag."
      ],
      sql: `-- Supabase SQL: Prevent role modification from public users
CREATE OR REPLACE FUNCTION public.prevent_role_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.role <> OLD.role OR NEW.is_admin <> OLD.is_admin THEN
    IF auth.uid() IS NULL OR NOT (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) THEN
      RAISE EXCEPTION 'Access Denied: You cannot modify roles or admin flags.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;`
    },
    {
      version: "v1.0.1",
      date: "2026-02-12",
      title: "E2E Message Encryption & Auto-deletion",
      description: "Implemented E2E client-side encryption and scheduled serverless auto-deletion functions.",
      changes: [
        "Implemented PBKDF2 + AES-GCM 256 client-side cryptography inside utils/encryption.ts.",
        "Configured messages table migration adding expires_at, is_deleted columns, and RLS filtering policies.",
        "Deployed Supabase Edge Function (delete-expired-messages) running hourly via pg_cron to clean expired logs."
      ],
      sql: `-- Supabase SQL: Expired Message RLS & Indexing
ALTER TABLE messages
ADD COLUMN encrypted_content text,
ADD COLUMN encryption_nonce text,
ADD COLUMN expires_at timestamp with time zone DEFAULT (now() + interval '24 hours'),
ADD COLUMN is_deleted boolean DEFAULT false;

CREATE POLICY "Only read non-expired messages"
ON messages FOR SELECT
USING (expires_at > now() AND is_deleted = false);

CREATE INDEX messages_expires_at_idx ON messages(expires_at);`
    },
    {
      version: "v1.0.0",
      date: "2026-02-11",
      title: "Command Center Dashboard Deployment",
      description: "Initial production launch of the CSE4Seoul Command Center application framework.",
      changes: [
        "Created responsive dark-mode Dashboard layout with operators information and Clash Royale integrations.",
        "Connected Next.js client with Supabase Server components and authentication middleware."
      ]
    }
  ];

  const handleCopy = (sqlText: string, version: string) => {
    navigator.clipboard.writeText(sqlText);
    setCopiedText(version);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const toggleVersion = (version: string) => {
    setExpandedVersion(expandedVersion === version ? null : version);
  };

  return (
    <div className="bg-gray-900/40 backdrop-blur-sm border border-gray-800 rounded-2xl overflow-hidden shadow-xl mt-8">
      {/* 위젯 헤더 */}
      <div className="p-6 border-b border-gray-800 flex justify-between items-center bg-gray-950/20">
        <h3 className="text-gray-400 text-sm font-bold tracking-wider flex items-center gap-2">
          <Terminal className="w-4 h-4 text-blue-400" />
          SYSTEM UPDATES & CHANGELOG
        </h3>
        <span className="text-xs text-gray-500 font-mono">STABLE CHANNEL</span>
      </div>

      {/* 체인지로그 리스트 */}
      <div className="divide-y divide-gray-800/60 p-6 space-y-4">
        {changelogs.map((log) => {
          const isExpanded = expandedVersion === log.version;
          return (
            <div key={log.version} className="bg-black/20 rounded-xl border border-gray-800/40 overflow-hidden transition-all duration-200">
              {/* 타이틀 바 */}
              <button
                type="button"
                onClick={() => toggleVersion(log.version)}
                className="w-full text-left px-5 py-4 flex items-center justify-between hover:bg-white/5 transition-colors"
              >
                <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-950 text-blue-400 border border-blue-900/50">
                      {log.version}
                    </span>
                    <span className="text-sm font-bold text-white">{log.title}</span>
                  </div>
                  <span className="text-xs text-gray-500 font-mono flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    {log.date}
                  </span>
                </div>
                <div>
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  )}
                </div>
              </button>

              {/* 디테일 패널 */}
              {isExpanded && (
                <div className="px-6 pb-6 pt-2 border-t border-gray-800/40 bg-black/10 text-sm text-gray-300 space-y-4">
                  <p className="text-gray-400 leading-relaxed">{log.description}</p>
                  
                  {/* 변경사항 리스트 */}
                  <div>
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <GitCommit className="w-3.5 h-3.5 text-blue-400" />
                      Commit Details
                    </h4>
                    <ul className="list-disc list-inside space-y-1.5 text-xs text-gray-400 ml-1">
                      {log.changes.map((change, idx) => (
                        <li key={idx} className="leading-relaxed">
                          <span className="text-gray-300">{change}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* SQL 쿼리 상자 */}
                  {log.sql && (
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                          <Code className="w-3.5 h-3.5 text-purple-400" />
                          Supabase Migration SQL
                        </h4>
                        <button
                          onClick={() => handleCopy(log.sql!, log.version)}
                          className="px-2.5 py-1 bg-gray-800/50 hover:bg-gray-800 text-gray-400 hover:text-white rounded text-xs font-mono flex items-center gap-1 transition-colors border border-gray-700/50"
                        >
                          {copiedText === log.version ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-green-500" />
                              Copied!
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              Copy SQL
                            </>
                          )}
                        </button>
                      </div>
                      <div className="relative">
                        <pre className="p-4 bg-black/80 border border-gray-800 rounded-lg text-xs font-mono text-gray-300 overflow-x-auto max-h-60 leading-relaxed scrollbar-thin scrollbar-thumb-gray-800 scrollbar-track-transparent">
                          <code>{log.sql}</code>
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
