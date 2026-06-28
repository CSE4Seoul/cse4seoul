"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";

interface PrivacyPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang?: "ko" | "en";
}

export default function PrivacyPolicyModal({ isOpen, onClose, lang = "ko" }: PrivacyPolicyModalProps) {
  const isKo = lang === "ko";

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          {/* Backdrop animates separately or together */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: "spring", duration: 0.4 }}
            className="z-10 w-full max-w-2xl max-h-[85vh] overflow-y-auto bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl p-6 md:p-8 scrollbar-thin scrollbar-thumb-gray-800 scrollbar-track-transparent text-gray-300"
          >
            <div className="flex justify-between items-center mb-6 border-b border-gray-800 pb-4 sticky top-0 bg-gray-900 z-20">
              <h3 className="text-xl font-bold text-white">
                {isKo ? "개인정보 처리방침" : "Privacy Policy"}
              </h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="Close"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-6 text-sm leading-relaxed">
              {isKo ? (
                // KOREAN VERSION
                <>
                  <p className="text-xs text-gray-400">
                    본 방침은 주식회사 CSE4Seoul(이하 &apos;회사&apos;)이 제공하는 서비스의 개인정보 수집 및 처리 기준을 설명합니다. 회사는 대한민국 개인정보 보호법 및 관계 법령을 준수합니다.
                  </p>

                  {/* 1. 개인정보 수집 항목 및 목적 */}
                  <section>
                    <h4 className="text-blue-400 font-semibold mb-2 text-base">1. 개인정보 수집 항목 및 목적</h4>
                    <p className="mb-2">회사는 최소한의 개인정보만 수집하며, 수집된 정보는 다음 목적 외의 용도로 사용되지 않습니다:</p>
                    <div className="overflow-x-auto">
                      <table className="w-full mt-2 border-collapse border border-gray-800 text-xs">
                        <thead>
                          <tr className="bg-gray-800">
                            <th className="border border-gray-700 p-2 text-left">수집 구분</th>
                            <th className="border border-gray-700 p-2 text-left">수집 항목</th>
                            <th className="border border-gray-700 p-2 text-left">수집 목적</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="border border-gray-700 p-2 font-semibold">필수 항목 (Local 가입)</td>
                            <td className="border border-gray-700 p-2">이메일 주소, 암호화된 비밀번호 해시, 코드네임(이름)</td>
                            <td className="border border-gray-700 p-2">회원 가입 및 계정 식별, 본인 인증 및 서비스 제공</td>
                          </tr>
                          <tr>
                            <td className="border border-gray-700 p-2 font-semibold">필수 항목 (OAuth 연동)</td>
                            <td className="border border-gray-700 p-2">이메일 주소 (미동의 시 가상 이메일 대체 생성), 프로필 닉네임, 프로필 사진</td>
                            <td className="border border-gray-700 p-2">소셜 로그인 연동, 계정 식별 및 기본 프로필 설정</td>
                          </tr>
                          <tr>
                            <td className="border border-gray-700 p-2 font-semibold">선택 항목</td>
                            <td className="border border-gray-700 p-2">소속 대학명, Clash Royale 계정 태그</td>
                            <td className="border border-gray-700 p-2">대시보드 맞춤 전술 배치 정보 구성 및 클랜 데이터 동기화</td>
                          </tr>
                          <tr>
                            <td className="border border-gray-700 p-2 font-semibold">자동 수집 항목</td>
                            <td className="border border-gray-700 p-2">IP 주소, 접속 로그, 서비스 이용 기록, 쿠키 세션</td>
                            <td className="border border-gray-700 p-2">서비스 부정 이용 방지, 통계 분석 및 보안 모니터링</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </section>

                  {/* 2. 개인정보의 처리 및 보유 기간 */}
                  <section>
                    <h4 className="text-blue-400 font-semibold mb-2 text-base">2. 개인정보의 처리 및 보유 기간</h4>
                    <ul className="list-disc ml-5 space-y-1">
                      <li><strong>가입 및 계정 정보:</strong> 회원 탈퇴 시까지 보유하며, 탈퇴 시 지체 없이 파기합니다.</li>
                      <li>
                        <strong>실시간 작전 대화 메시지:</strong> 
                        <span className="text-emerald-400 font-semibold"> 메시지 전송 후 24시간 동안 보관되며, 24시간이 경과하면 스케줄러(pg_cron)에 의해 데이터베이스에서 즉시 및 영구적으로 자동 삭제됩니다.</span>
                      </li>
                      <li><strong>법령에 따른 보존:</strong> 3항의 법령상 보관 의무가 있는 경우 해당 법정 기간 동안 별도 분리 보관합니다.</li>
                    </ul>
                  </section>

                  {/* 3. 법령상 보관 항목 및 기간 */}
                  <section>
                    <h4 className="text-blue-400 font-semibold mb-2 text-base">3. 법령상 보관 항목 및 기간</h4>
                    <div className="overflow-x-auto">
                      <table className="w-full mt-2 border-collapse border border-gray-800 text-xs">
                        <thead>
                          <tr className="bg-gray-800">
                            <th className="border border-gray-700 p-2 text-left">보관 대상 항목</th>
                            <th className="border border-gray-700 p-2 text-left">보존 기간</th>
                            <th className="border border-gray-700 p-2 text-left">근거 법령</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="border border-gray-700 p-2">계약 또는 청약철회 등에 관한 기록</td>
                            <td className="border border-gray-700 p-2">5년</td>
                            <td className="border border-gray-700 p-2">전자상거래 등에서의 소비자보호에 관한 법률</td>
                          </tr>
                          <tr>
                            <td className="border border-gray-700 p-2">소비자의 불만 또는 분쟁처리에 관한 기록</td>
                            <td className="border border-gray-700 p-2">3년</td>
                            <td className="border border-gray-700 p-2">전자상거래 등에서의 소비자보호에 관한 법률</td>
                          </tr>
                          <tr>
                            <td className="border border-gray-700 p-2">접속 로그 (내부 보안 및 시스템 감시 목적)</td>
                            <td className="border border-gray-700 p-2">3개월</td>
                            <td className="border border-gray-700 p-2">통신비밀보호법</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </section>

                  {/* 4. 개인정보의 파기 절차 및 방법 */}
                  <section>
                    <h4 className="text-blue-400 font-semibold mb-2 text-base">4. 개인정보의 파기 절차 및 방법</h4>
                    <p>회사는 파기 사유가 발생한 개인정보를 선정하고, 아래의 방법으로 안전하게 파기합니다:</p>
                    <ul className="list-disc ml-5 mt-2 space-y-1">
                      <li><strong>전자적 파일 형태:</strong> 기록을 재생할 수 없는 기술적 방법(포맷, 안전 덮어쓰기 등)을 사용하여 영구 삭제합니다.</li>
                      <li><strong>종이 문서 및 출력물:</strong> 분쇄기로 파쇄하거나 소각하여 물리적으로 파기합니다.</li>
                    </ul>
                  </section>

                  {/* 5. 개인정보의 안전성 확보 조치 */}
                  <section>
                    <h4 className="text-blue-400 font-semibold mb-2 text-base">5. 개인정보의 안전성 확보 조치</h4>
                    <p>회사는 개인정보의 안전성 확보를 위해 다음과 같은 기술적·관리적 조치를 취하고 있습니다:</p>
                    <ul className="list-disc ml-5 mt-2 space-y-1">
                      <li>
                        <strong>종단간(E2E) 클라이언트 암호화:</strong> 실시간 통신 메시지는 브라우저단에서 
                        <span className="text-emerald-400 font-semibold"> AES-GCM 256 알고리즘</span>으로 암호화되어 전송됩니다. 서버나 DB에는 평문이 전송되지 않으며 복호화는 정당한 비밀키를 가진 클라이언트 단에서만 수행됩니다.
                      </li>
                      <li><strong>암호화 전송:</strong> 외부와의 통신은 SSL/TLS 보안 프로토콜을 통과하여 처리됩니다.</li>
                      <li><strong>데이터베이스 접근 제한:</strong> Supabase RLS(Row Level Security) 및 트리거 감시 제어를 통해 비정상적인 권한 조작을 엄격히 규제합니다.</li>
                    </ul>
                  </section>

                  {/* 6. 개인정보 국외 이전 (Supabase 위탁) */}
                  <section>
                    <h4 className="text-blue-400 font-semibold mb-2 text-base">6. 개인정보 국외 이전 및 처리 위탁</h4>
                    <p>회사는 안정적인 데이터 스토리지 및 인증 인프라 제공을 위해 다음과 같이 개인정보를 국외에 위탁·저장합니다:</p>
                    <div className="bg-black/30 p-3 rounded-lg border border-gray-800 text-xs mt-2 space-y-1">
                      <p>• <strong>수탁업체 / 국가:</strong> Supabase, Inc. / 미국 (USA)</p>
                      <p>• <strong>이전 항목:</strong> 이메일, 계정 정보, 사용자 프로필, 접속 로그</p>
                      <p>• <strong>이전 목적:</strong> 클라우드 기반 데이터베이스 보관 및 사용자 로그인 세션 관리</p>
                      <p>• <strong>보유 및 이용기간:</strong> 회원 탈퇴 시 혹은 서비스 계약 종료 시까지</p>
                      <p>• <strong>보호 조치:</strong> 미국 표준 계약 조항(SCC) 준수 및 방화벽/접근 제어를 통한 보안 통제</p>
                    </div>
                  </section>

                  {/* 7. 정보주체의 권리 및 행사 절차 */}
                  <section>
                    <h4 className="text-blue-400 font-semibold mb-2 text-base">7. 정보주체의 권리 및 행사 절차</h4>
                    <ul className="list-disc ml-5 space-y-1">
                      <li>정보주체는 언제든지 자신의 개인정보 열람, 정정, 삭제 및 처리 정지를 요구할 수 있습니다.</li>
                      <li>권리 행사는 개인정보 보호책임자 또는 고객지원 채널을 통해 서면, 이메일로 요청할 수 있으며, 회사는 요청을 받은 날로부터 <strong>10일 이내</strong>에 신속히 조치하고 결과를 통보합니다.</li>
                      <li>법정 대리인이나 위임을 받은 자를 통해서도 대리 권리 행사가 가능합니다.</li>
                    </ul>
                  </section>

                  {/* 8. 쿠키(Cookie) 수집 및 거부 관련 고지 */}
                  <section>
                    <h4 className="text-blue-400 font-semibold mb-2 text-base">8. 쿠키(Cookie)의 설치·운영 및 거부</h4>
                    <p>회사는 개인화된 서비스 제공 및 세션 유지를 위해 쿠키를 사용합니다.</p>
                    <ul className="list-disc ml-5 mt-2 space-y-1 text-xs text-gray-400">
                      <li><strong>목적:</strong> 사용자 로그인 정보 유지(세션), 접속 빈도 분석</li>
                      <li><strong>거부 방법:</strong> 브라우저 설정(Chrome의 경우: 설정 &gt; 개인정보 및 보안 &gt; 인터넷 사용 기록 삭제 또는 쿠키 차단)을 통해 설정할 수 있습니다.</li>
                      <li><strong>주의:</strong> 쿠키 저장을 거부할 경우 로그인이 필요한 대시보드 및 실시간 통신 시스템 등의 이용에 제한이 생길 수 있습니다.</li>
                    </ul>
                  </section>

                  {/* 9. 개인정보 보호책임자 지정 */}
                  <section>
                    <h4 className="text-blue-400 font-semibold mb-2 text-base">9. 개인정보 보호책임자 지정</h4>
                    <p>개인정보 처리에 관한 문의 사항이나 불만 사항은 아래 보호책임자에게 연락해 주시기 바랍니다:</p>
                    <div className="bg-black/30 p-3 rounded-lg border border-gray-800 mt-2">
                      <p>• <strong>부서 / 성명:</strong> CSE4Seoul 지원팀 / 개인정보 보호책임자 (CPO)</p>
                      <p>• <strong>연락처:</strong> 02-1234-5678</p>
                      <p>• <strong>이메일:</strong> support@cse4seoul.com</p>
                    </div>
                  </section>

                  {/* 10. 방침 고지 및 개정일자 */}
                  <section>
                    <h4 className="text-blue-400 font-semibold mb-2 text-base">10. 개인정보 처리방침의 변경 고지</h4>
                    <p>본 개인정보 처리방침의 개정이 있을 경우, 시행 최소 7일 전부터 서비스 내 공지사항 또는 이메일을 통해 개정 내용을 고지하겠습니다.</p>
                    <p className="mt-2 text-xs text-gray-500 font-semibold">공고일자: 2026-06-28 / 시행일자: 2026-06-28</p>
                  </section>
                </>
              ) : (
                // ENGLISH VERSION
                <>
                  <p className="text-xs text-gray-400">
                    This Privacy Policy describes how CSE4Seoul (&quot;Company&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) collects, uses, and discloses your personal information. We comply with the Personal Information Protection Act of the Republic of Korea.
                  </p>

                  {/* 1. Collection Items and Purposes */}
                  <section>
                    <h4 className="text-blue-400 font-semibold mb-2 text-base">1. Items of Personal Information Collected and Purpose</h4>
                    <p className="mb-2">We collect the minimum amount of personal information required, and do not use it for purposes other than those specified below:</p>
                    <div className="overflow-x-auto">
                      <table className="w-full mt-2 border-collapse border border-gray-800 text-xs">
                        <thead>
                          <tr className="bg-gray-800">
                            <th className="border border-gray-700 p-2 text-left">Category</th>
                            <th className="border border-gray-700 p-2 text-left">Collected Items</th>
                            <th className="border border-gray-700 p-2 text-left">Purpose</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="border border-gray-700 p-2 font-semibold">Required (Local Signups)</td>
                            <td className="border border-gray-700 p-2">Email address, encrypted password hash, codename (name)</td>
                            <td className="border border-gray-700 p-2">Account creation, identity verification, and service delivery</td>
                          </tr>
                          <tr>
                            <td className="border border-gray-700 p-2 font-semibold">Required (OAuth Integration)</td>
                            <td className="border border-gray-700 p-2">Email address (virtual email generated on omission), profile nickname, profile picture</td>
                            <td className="border border-gray-700 p-2">Social login mapping, user identification, and basic profile configuration</td>
                          </tr>
                          <tr>
                            <td className="border border-gray-700 p-2 font-semibold">Optional</td>
                            <td className="border border-gray-700 p-2">University affiliation, Clash Royale tag</td>
                            <td className="border border-gray-700 p-2">Customizing dashboard metrics and synchronizing clan data</td>
                          </tr>
                          <tr>
                            <td className="border border-gray-700 p-2 font-semibold">Auto-Collected</td>
                            <td className="border border-gray-700 p-2">IP address, access logs, system history, session cookies</td>
                            <td className="border border-gray-700 p-2">Abuse prevention, security monitoring, and statistical analytics</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </section>

                  {/* 2. Retention and Processing Period */}
                  <section>
                    <h4 className="text-blue-400 font-semibold mb-2 text-base">2. Processing and Retention Period</h4>
                    <ul className="list-disc ml-5 space-y-1">
                      <li><strong>Account Information:</strong> Retained until membership withdrawal, destroyed immediately upon withdrawal.</li>
                      <li>
                        <strong>Real-time Chat Messages:</strong> 
                        <span className="text-emerald-400 font-semibold"> Retained for 24 hours from the transmission, after which they are permanently and automatically deleted from the database by pg_cron.</span>
                      </li>
                      <li><strong>Legal Retention:</strong> Kept in separate tables if required under statutory compliance as listed in Section 3.</li>
                    </ul>
                  </section>

                  {/* 3. Statutory Retention Requirements */}
                  <section>
                    <h4 className="text-blue-400 font-semibold mb-2 text-base">3. Statutory Retention Requirements</h4>
                    <div className="overflow-x-auto">
                      <table className="w-full mt-2 border-collapse border border-gray-800 text-xs">
                        <thead>
                          <tr className="bg-gray-800">
                            <th className="border border-gray-700 p-2 text-left">Retention Items</th>
                            <th className="border border-gray-700 p-2 text-left">Period</th>
                            <th className="border border-gray-700 p-2 text-left">Legal Basis</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="border border-gray-700 p-2">Records on contracts or subscription cancellations</td>
                            <td className="border border-gray-700 p-2">5 years</td>
                            <td className="border border-gray-700 p-2">Act on Consumer Protection in Electronic Commerce</td>
                          </tr>
                          <tr>
                            <td className="border border-gray-700 p-2">Records on consumer complaints or dispute settlements</td>
                            <td className="border border-gray-700 p-2">3 years</td>
                            <td className="border border-gray-700 p-2">Act on Consumer Protection in Electronic Commerce</td>
                          </tr>
                          <tr>
                            <td className="border border-gray-700 p-2">Access logs (system diagnostics and security)</td>
                            <td className="border border-gray-700 p-2">3 months</td>
                            <td className="border border-gray-700 p-2">Protection of Communications Secrets Act</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </section>

                  {/* 4. Destruction Method */}
                  <section>
                    <h4 className="text-blue-400 font-semibold mb-2 text-base">4. Destruction Procedures and Methods</h4>
                    <p>When personal information becomes unnecessary, it is securely destroyed via the following procedures:</p>
                    <ul className="list-disc ml-5 mt-2 space-y-1">
                      <li><strong>Electronic Files:</strong> Permanently deleted using technical methods that make record recovery impossible.</li>
                      <li><strong>Hardcopies:</strong> Shredded using paper shredders or incinerated.</li>
                    </ul>
                  </section>

                  {/* 5. Security Safeguards */}
                  <section>
                    <h4 className="text-blue-400 font-semibold mb-2 text-base">5. Technical and Administrative Safety Measures</h4>
                    <p>We deploy the following measures to guarantee data security:</p>
                    <ul className="list-disc ml-5 mt-2 space-y-1">
                      <li>
                        <strong>End-to-End Client Encryption:</strong> Messages are encrypted on the browser using 
                        <span className="text-emerald-400 font-semibold"> AES-GCM 256</span> before transmission. Plaintext is never stored on the server.
                      </li>
                      <li><strong>Transport Security:</strong> All external API requests are forced through secure SSL/TLS channels.</li>
                      <li><strong>Access Controls:</strong> Supabase RLS and trigger monitors enforce authorization and restrict abnormal privilege updates.</li>
                    </ul>
                  </section>

                  {/* 6. Overseas Transfer (Supabase Entrustment) */}
                  <section>
                    <h4 className="text-blue-400 font-semibold mb-2 text-base">6. Overseas Transmisson and Subcontracting</h4>
                    <p>For cloud authentication infrastructure, we outsource data storage to the following service provider:</p>
                    <div className="bg-black/30 p-3 rounded-lg border border-gray-800 text-xs mt-2 space-y-1">
                      <p>• <strong>Entrusted Entity / Country:</strong> Supabase, Inc. / United States (USA)</p>
                      <p>• <strong>Transferred Items:</strong> Email, user profiles, login metadata, access logs</p>
                      <p>• <strong>Purpose:</strong> Database storage and user authentication session management</p>
                      <p>• <strong>Retention Period:</strong> Until account deletion or contract termination</p>
                      <p>• <strong>Safeguards:</strong> Adherence to Standard Contractual Clauses (SCC) and security access monitors</p>
                    </div>
                  </section>

                  {/* 7. Rights of Data Subjects */}
                  <section>
                    <h4 className="text-blue-400 font-semibold mb-2 text-base">7. Rights of Data Subjects and Exercises</h4>
                    <ul className="list-disc ml-5 space-y-1">
                      <li>Users can request inspection, correction, erasure, or suspension of processing of their data at any time.</li>
                      <li>Requests can be made via email to the CPO. We will take actions and notify you within <strong>10 days</strong>.</li>
                      <li>Authorized representatives or legal guardians may exercise rights on the user&apos;s behalf.</li>
                    </ul>
                  </section>

                  {/* 8. Cookies Configuration */}
                  <section>
                    <h4 className="text-blue-400 font-semibold mb-2 text-base">8. Operating Cookies and Rejection Policies</h4>
                    <p>We use cookies to maintain user logins and configure customized session settings.</p>
                    <ul className="list-disc ml-5 mt-2 space-y-1 text-xs text-gray-400">
                      <li><strong>Purpose:</strong> Session persistence, usage analysis.</li>
                      <li><strong>Rejection:</strong> Modify browser settings (e.g., Chrome Settings &gt; Privacy and Security &gt; Cookies).</li>
                      <li><strong>Note:</strong> Blocking cookies may limit access to authenticated dashboards and real-time chat elements.</li>
                    </ul>
                  </section>

                  {/* 9. Chief Privacy Officer (CPO) details */}
                  <section>
                    <h4 className="text-blue-400 font-semibold mb-2 text-base">9. Contact Details of Chief Privacy Officer (CPO)</h4>
                    <p>If you have any questions or complaints regarding privacy processing, please contact the CPO:</p>
                    <div className="bg-black/30 p-3 rounded-lg border border-gray-800 mt-2">
                      <p>• <strong>Department / Name:</strong> CSE4Seoul Support Team / Chief Privacy Officer (CPO)</p>
                      <p>• <strong>Telephone:</strong> 02-1234-5678</p>
                      <p>• <strong>Email:</strong> support@cse4seoul.com</p>
                    </div>
                  </section>

                  {/* 10. Modifications */}
                  <section>
                    <h4 className="text-blue-400 font-semibold mb-2 text-base">10. Notification of Modifications</h4>
                    <p>Any revisions to this policy will be publicized via notice or email at least 7 days prior to implementation.</p>
                    <p className="mt-2 text-xs text-gray-500 font-semibold">Publication Date: 2026-06-28 / Effective Date: 2026-06-28</p>
                  </section>
                </>
              )}
            </div>

            <button
              onClick={onClose}
              className="w-full mt-8 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition-all shadow-lg shadow-blue-500/20"
            >
              {isKo ? "동의 및 확인" : "Agree & Confirm"}
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
