import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  ArrowDownToLine,
  ArrowLeft,
  ArrowUpRight,
  Bell,
  BookOpen,
  Check,
  CheckCheck,
  ChevronDown,
  ChevronRight,
  CircleDollarSign,
  ClipboardList,
  CreditCard,
  Download,
  FileClock,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Menu,
  Plus,
  Printer,
  Search,
  Settings2,
  ShieldCheck,
  UserRound,
  UserRoundPlus,
  Users,
  Wifi,
  WifiOff,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "../lib/supabase";
import { Button as ShadcnButton } from "../components/ui/button";

export const Route = createFileRoute("/")({ component: Scolaris });

type Role = "founder" | "secretary";
type Page =
  | "dashboard"
  | "students"
  | "payments"
  | "debts"
  | "history"
  | "reports"
  | "classes"
  | "team"
  | "student"
  | "receipt";
type Student = {
  id: string;
  matricule: string;
  lastName: string;
  firstNames: string;
  sex: string;
  className: string;
  levelName?: string;
  classId?: string;
  secretaryId?: string;
  year: string;
  parent: string;
  phone: string;
  discount: number;
  joined: string;
};
type Payment = {
  id: string;
  receipt: string;
  studentId: string;
  amount: number;
  mode: string;
  period: string;
  note: string;
  status: "valid" | "void";
  reason?: string;
  trancheDue?: string;
  cancelledBy?: string;
  cancelledAt?: string;
  secretaryId?: string;
  by: string;
  date: string;
};
type SchoolClass = {
  id?: string;
  name: string;
  levelName?: string;
  registration: number;
  tuition: number;
  due: string;
  secretaryId?: string;
};
type LogItem = {
  id: string;
  action: string;
  detail: string;
  by: string;
  date: string;
  secretaryId?: string;
};
type Report = {
  id: string;
  studentId: string;
  message: string;
  status: "open" | "treated";
  response?: string;
  by: string;
  date: string;
};
type TeamMember = {
  id: string;
  name: string;
  email: string;
  role: Role;
  active: boolean;
  sessionPeriod?: string;
  createdAt?: string;
  structureNumber?: number;
};
type SchoolInfo = { name: string; address: string; phone: string; year: string; isDemo?: boolean };
type NavItem = {
  id: Page;
  label: string;
  Icon: React.ComponentType<{ size?: number }>;
};

const classSeed: SchoolClass[] = [
  { name: "CP1", levelName: "CP1", registration: 25000, tuition: 125000, due: "2026-10-31", secretaryId: "demo-secretary" },
  { name: "CE2", levelName: "CE2", registration: 25000, tuition: 150000, due: "2026-11-15", secretaryId: "demo-secretary" },
  { name: "CM2", levelName: "CM2", registration: 30000, tuition: 180000, due: "2026-12-15", secretaryId: "demo-secretary" },
];
const names = [
  ["Koné", "Ibrahim", "Garçon", "CP1"],
  ["Traoré", "Mariam", "Fille", "CE2"],
  ["Yao", "Kevin", "Garçon", "CM2"],
  ["Bamba", "Awa", "Fille", "CP1"],
  ["Ouattara", "Salif", "Garçon", "CE2"],
  ["Diabaté", "Aminata", "Fille", "CM2"],
  ["Coulibaly", "Moussa", "Garçon", "CP1"],
  ["N'Guessan", "Grâce", "Fille", "CE2"],
  ["Kouadio", "Junior", "Garçon", "CM2"],
  ["Sanogo", "Fanta", "Fille", "CP1"],
  ["Touré", "Adama", "Garçon", "CE2"],
  ["Konan", "Esther", "Fille", "CM2"],
];
const studentSeed: Student[] = names.map(
  ([lastName, firstNames, sex, className], i) => ({
    id: `eleve-${i + 1}`,
    matricule: `MAT-${String(i + 1).padStart(4, "0")}`,
    lastName,
    firstNames,
    sex,
    className,
    levelName: className,
    secretaryId: "demo-secretary",
    year: "2026-2027",
    parent: ["Kouamé", "Diallo", "Yao", "Koffi"][i % 4],
    phone: `07 0${i % 9} 12 34 5${i % 9} 6${i % 9}`,
    discount: [3, 7].includes(i) ? 10000 : 0,
    joined: "2026-09-02",
  }),
);
const paymentSeed: Payment[] = [
  ["eleve-1", 150000, "Espèces"],
  ["eleve-2", 175000, "Mobile money"],
  ["eleve-3", 210000, "Virement"],
  ["eleve-5", 175000, "Espèces"],
  ["eleve-4", 50000, "Mobile money"],
  ["eleve-6", 75000, "Espèces"],
  ["eleve-8", 50000, "Chèque"],
].map(([studentId, amount, mode], i) => ({
  id: `p-${i + 1}`,
  receipt: `REC-${1001 + i}`,
  studentId: String(studentId),
  amount: Number(amount),
  mode: String(mode),
  period: "Scolarité 2026-2027",
  note: "",
  status: "valid",
  secretaryId: "demo-secretary",
  by: "Fatou Diallo",
  date: `2026-10-${String(12 - i).padStart(2, "0")}T10:20:00`,
}));
const logSeed: LogItem[] = [
  {
    id: "l1",
    action: "Paiement enregistré",
    detail: "Koné Ibrahim · 150 000 FCFA",
    by: "Fatou Diallo",
    date: "2026-10-12T10:20:00",
  },
  {
    id: "l2",
    action: "Paiement enregistré",
    detail: "Traoré Mariam · 175 000 FCFA",
    by: "Fatou Diallo",
    date: "2026-10-11T09:15:00",
  },
  {
    id: "l3",
    action: "Élève inscrit",
    detail: "Konan Esther · MAT-0012",
    by: "Fatou Diallo",
    date: "2026-10-10T14:05:00",
  },
  {
    id: "l4",
    action: "Paiement enregistré",
    detail: "Yao Kevin · 210 000 FCFA",
    by: "Fatou Diallo",
    date: "2026-10-09T11:40:00",
  },
  {
    id: "l5",
    action: "Frais de classe modifiés",
    detail: "CP1 · année 2026-2027",
    by: "Fatou Diallo",
    date: "2026-10-08T16:10:00",
  },
  {
    id: "l6",
    action: "Paiement enregistré",
    detail: "Ouattara Salif · 175 000 FCFA",
    by: "Fatou Diallo",
    date: "2026-10-07T08:32:00",
  },
  {
    id: "l7",
    action: "Nouvelle année scolaire",
    detail: "2026-2027",
    by: "Kouassi Aya",
    date: "2026-09-02T08:00:00",
  },
];
const reportSeed: Report[] = [
  {
    id: "r1",
    studentId: "eleve-6",
    message: "Le parent souhaite un échéancier pour le solde.",
    status: "open",
    by: "Kouassi Aya",
    date: "2026-10-12T09:30:00",
  },
];
const money = (n: number) => `${Math.round(n).toLocaleString("fr-FR")} FCFA`;
const SECRETARY_DOMAIN = "secretaires.scolaris.app";
const loginName = (email: string) =>
  email.endsWith(`@${SECRETARY_DOMAIN}`) ? email.split("@")[0] : email;
const functionError = async (error: unknown) => {
  let message = error instanceof Error ? error.message : "Erreur inconnue.";
  try {
    const body = await (error as any).context?.json();
    message = body?.error ?? body?.message ?? message;
  } catch {}
  return message;
};
const parseFrenchDate = (value: string) => {
  if (!value.trim()) return null;
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value.trim());
  if (!match) return undefined;
  const [, day, month, year] = match;
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  if (date.getUTCFullYear() !== Number(year) || date.getUTCMonth() !== Number(month) - 1 || date.getUTCDate() !== Number(day)) return undefined;
  return `${year}-${month}-${day}`;
};
const formatFrenchDate = (value?: string) => value ? new Intl.DateTimeFormat("fr-FR", { timeZone: "UTC" }).format(new Date(`${value.slice(0, 10)}T00:00:00Z`)) : "";
const paymentModeCode = (value: string) => ({ "Espèces": "especes", "Mobile money": "mobile_money", Virement: "virement", Chèque: "cheque" } as Record<string, string>)[value] ?? value;
const dateLabel = (date: string) =>
  date
    ? new Intl.DateTimeFormat("fr-FR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }).format(new Date(date))
    : "—";
const initials = (name: string) =>
  name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  

function Spinner({ full = false }: { full?: boolean }) {
  return (
    <div style={{ minHeight: full ? "100vh" : "50vh", display: "grid", placeItems: "center" }}>
      <style>{`@keyframes scolaris-spin{to{transform:rotate(360deg)}}`}</style>
      <div
        role="status"
        aria-label="Chargement"
        style={{
          width: 44,
          height: 44,
          border: "4px solid rgba(0,0,0,.1)",
          borderTopColor: "#0f766e",
          borderRadius: "50%",
          animation: "scolaris-spin .8s linear infinite",
        }}
      />
    </div>
  );
}
function Scolaris() {
  const [role, setRole] = useState<Role | null>(null);
  const [userId, setUserId] = useState("");
  const [cloudSession, setCloudSession] = useState(false);
  const [demoMode, setDemoMode] = useState(!supabase);
  const [structureFilter, setStructureFilter] = useState("all");
  const [unreadPayments, setUnreadPayments] = useState(0);
  const [page, setPage] = useState<Page>("dashboard");
  const [students, setStudents] = useState<Student[]>(supabase ? [] : studentSeed);
  const [payments, setPayments] = useState<Payment[]>(supabase ? [] : paymentSeed);
  const [classes, setClasses] = useState<SchoolClass[]>(supabase ? [] : classSeed);
  const [logs, setLogs] = useState<LogItem[]>(supabase ? [] : logSeed);
  const [reports, setReports] = useState<Report[]>(supabase ? [] : reportSeed);
    const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
    const [demoTeam, setDemoTeam] = useState<TeamMember[]>([
      { id: "demo-founder", name: "Kouassi Aya", email: "fondateur@demo-ecole.com", role: "founder", active: true },
      { id: "demo-secretary", name: "Fatou Diallo", email: "secretaire@demo-ecole.com", role: "secretary", active: true, sessionPeriod: "2026-2027", structureNumber: 1 },
    ]);
    const [nextDemoStructureNumber, setNextDemoStructureNumber] = useState(2);
    const [schoolInfo, setSchoolInfo] = useState<SchoolInfo>(supabase
      ? { name: "", address: "", phone: "", year: "", isDemo: false }
      : { name: "École Les Lauriers", address: "Cocody, Abidjan", phone: "+225 07 00 00 00 00", year: "2026-2027", isDemo: true });
  const [cloudSchoolId, setCloudSchoolId] = useState("");
  const [cloudClassIds, setCloudClassIds] = useState<Record<string, string>>({});
  const [studentId, setStudentId] = useState("");
  const [studentClassName, setStudentClassName] = useState("");
  const [listClassKey, setListClassKey] = useState("");
  const [paymentId, setPaymentId] = useState("");
  const [modal, setModal] = useState<
    "student" | "payment" | "void" | "report" | "staff" | "session" | "list" | null
  >(null);
  const [query, setQuery] = useState("");
  const [classFilter, setClassFilter] = useState("Toutes les classes");
  const [debtFilter, setDebtFilter] = useState("Tous les soldes");
  const [online, setOnline] = useState(typeof navigator === "undefined" || navigator.onLine);
  const [menuOpen, setMenuOpen] = useState(false);
  const [authLoading, setAuthLoading] = useState(Boolean(supabase));
const [dataReady, setDataReady] = useState(!supabase);
const schoolIdRef = useRef("");
const profileNamesRef = useRef<Map<string, string>>(new Map());

  const loadDemoData = () => {
    setDataReady(true);
    setSchoolInfo({ name: "École Les Lauriers", address: "Cocody, Abidjan", phone: "+225 07 00 00 00 00", year: "2026-2027", isDemo: true });
    try {
      const saved = localStorage.getItem("scolaris-demo");
      const data = saved ? JSON.parse(saved) : {};
      setStudents(data.students ?? studentSeed);
      setPayments(data.payments ?? paymentSeed);
      setClasses(data.classes ?? classSeed);
      setLogs(data.logs ?? logSeed);
      setReports(data.reports ?? reportSeed);
    } catch {
      localStorage.removeItem("scolaris-demo");
      setStudents(studentSeed);
      setPayments(paymentSeed);
      setClasses(classSeed);
      setLogs(logSeed);
      setReports(reportSeed);
    }
  };
  const clearAccountData = () => {
    setStudents([]);
    setPayments([]);
    setClasses([]);
    setLogs([]);
    setReports([]);
    setTeamMembers([]);
    setCloudSchoolId("");
    setCloudClassIds({});
    setSchoolInfo({ name: "", address: "", phone: "", year: "", isDemo: false });
    schoolIdRef.current = "";
    setDataReady(false);
  };

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      void navigator.serviceWorker.register("/sw.js");
    }
    const onlineNow = () => setOnline(true),
      offlineNow = () => setOnline(false);
    window.addEventListener("online", onlineNow);
    window.addEventListener("offline", offlineNow);
    if (!supabase) loadDemoData();
    return () => {
      window.removeEventListener("online", onlineNow);
      window.removeEventListener("offline", offlineNow);
    };
  }, []);
  useEffect(() => {
    if (demoMode) {
      localStorage.setItem(
        "scolaris-demo",
        JSON.stringify({ students, payments, classes, logs, reports }),
      );
    }
  }, [students, payments, classes, logs, reports, demoMode]);

  useEffect(() => {
  const client = supabase;
  if (!client) return;
  let current = true;
  const restore = async () => {
    try {
      const { data } = await client.auth.getSession();
      const id = data.session?.user.id;
      if (!id || !current) return;
      const { data: roleRow } = await client
        .from("user_roles")
        .select("role")
        .eq("user_id", id)
        .maybeSingle();
      if (current && (roleRow?.role === "founder" || roleRow?.role === "secretary")) {
        try {
          const saved = JSON.parse(localStorage.getItem("scolaris-nav") ?? "{}");
          if (saved.userId === id && saved.page) {
            setPage(saved.page);
            setStudentId(saved.studentId ?? "");
            setPaymentId(saved.paymentId ?? "");
          }
        } catch {}
        setDemoMode(false);
        setUserId(id);
        setCloudSession(true);
        setRole(roleRow.role);
      }
    } finally {
      if (current) setAuthLoading(false);
    }
  };
  void restore();
  return () => { current = false; };
}, []);

useEffect(() => {
  if (!role || !cloudSession) return;
  try {
    localStorage.setItem("scolaris-nav", JSON.stringify({ userId, page, studentId, paymentId }));
  } catch {}
}, [role, cloudSession, userId, page, studentId, paymentId]);

  useEffect(() => {
    const client = supabase;
    if (!client || !userId) return;
    let alive = true;
    const refresh = async () => {
      let schoolId = schoolIdRef.current;
if (!schoolId) {
  const { data: profile } = await client
    .from("profiles")
    .select("school_id")
    .eq("id", userId)
    .single();
  if (!profile || !alive) return;
  schoolId = profile.school_id;
  schoolIdRef.current = schoolId;
}
setCloudSchoolId(schoolId);
      const [classResult, studentResult, paymentResult, logResult, reportResult, profileResult, roleResult, schoolResult] = await Promise.all([
        client.from("classes").select("*").eq("school_id", schoolId).order("level_name").order("name"),
        client.from("students").select("*").eq("school_id", schoolId).order("last_name"),
        client.from("payments").select("*").eq("school_id", schoolId).order("created_at", { ascending: false }),
        client.from("activity_log").select("*").eq("school_id", schoolId).order("created_at", { ascending: false }).limit(100),
        client.from("reports").select("*").eq("school_id", schoolId).order("created_at", { ascending: false }),
        client.from("profiles").select("id, full_name, email, active, session_period, structure_number, created_at").eq("school_id", schoolId),
        client.from("user_roles").select("user_id, role"),
        client.from("schools").select("*").eq("id", schoolId).single(),
      ]);
      if (!alive) return;
if (!classResult.data || !studentResult.data || !paymentResult.data) { setDataReady(true); return; }
      const cloudClasses: SchoolClass[] = classResult.data.map((row) => ({
        id: row.id,
        name: row.name,
        levelName: row.level_name || row.name,
        registration: row.registration_fee,
        tuition: row.tuition_fee,
        due: row.due_date,
        secretaryId: row.secretary_id,
      }));
      setCloudClassIds(Object.fromEntries(classResult.data.map((row) => [row.id, row.id])));
      if (schoolResult.data) setSchoolInfo({
        name: schoolResult.data.name,
        address: schoolResult.data.address,
        phone: schoolResult.data.phone,
        year: schoolResult.data.default_school_year,
        isDemo: schoolResult.data.is_demo === true,
      });
      const profileNames = new Map((profileResult.data ?? []).map((row) => [row.id, row.full_name]));
      profileNamesRef.current = profileNames as Map<string, string>;
      const memberRoles = new Map((roleResult.data ?? []).map((row) => [row.user_id, row.role]));
      const secretaryOrder = (profileResult.data ?? [])
        .filter((row) => memberRoles.get(row.id) === "secretary")
        .sort((a, b) => a.created_at.localeCompare(b.created_at));
      const structureNumbers = new Map(secretaryOrder.map((row, index) => [row.id, row.structure_number ?? index + 1]));
      setTeamMembers((profileResult.data ?? []).flatMap((row) => {
        const memberRole = memberRoles.get(row.id);
        return memberRole === "founder" || memberRole === "secretary"
          ? [{ id: row.id, name: row.full_name, email: row.email, role: memberRole, active: row.active, sessionPeriod: row.session_period, createdAt: row.created_at, structureNumber: structureNumbers.get(row.id) }]
          : [];
      }));
      setClasses(cloudClasses);
      setStudents(studentResult.data.map((row) => ({
        id: row.id,
        matricule: row.matricule,
        lastName: row.last_name,
        firstNames: row.first_names,
        sex: row.sex,
        className: classResult.data.find((item) => item.id === row.class_id)?.name ?? "—",
        levelName: classResult.data.find((item) => item.id === row.class_id)?.level_name ?? "",
        classId: row.class_id,
        secretaryId: row.secretary_id,
        year: row.school_year,
        parent: row.parent_name,
        phone: row.parent_phone,
        discount: row.discount,
        joined: row.enrolled_at,
      })));
      setPayments(paymentResult.data.map((row) => ({
        id: row.id,
        receipt: row.receipt_number,
        studentId: row.student_id,
        amount: row.amount,
        mode: ({ especes: "Espèces", mobile_money: "Mobile money", virement: "Virement", cheque: "Chèque" } as Record<string, string>)[row.mode] ?? row.mode,
        period: row.period,
        note: row.note,
        status: row.status,
        reason: row.void_reason ?? undefined,
        trancheDue: row.tranche_due ?? undefined,
        cancelledBy: row.cancelled_by ?? undefined,
        cancelledAt: row.cancelled_at ?? undefined,
        secretaryId: row.secretary_id,
        by: profileNames.get(row.created_by) ?? row.created_by,
        date: row.created_at,
      })));
      setDataReady(true);
      if (logResult.data) setLogs(logResult.data.map((row) => {
        const details = row.details as Record<string, unknown>;
        const secretaryId = typeof details?.secretary_id === "string"
          ? details.secretary_id
          : typeof row.author_id === "string" && memberRoles.get(row.author_id) === "secretary"
            ? row.author_id
            : undefined;
        return {
          id: String(row.id),
          action: row.action,
          detail: JSON.stringify(row.details),
          by: profileNames.get(row.author_id) ?? "Scolaris",
          date: row.created_at,
          secretaryId,
        };
      }));
      if (reportResult.data) setReports(reportResult.data.map((row) => ({
        id: row.id,
        studentId: row.student_id ?? "",
        message: row.message,
        status: row.status,
        response: row.secretary_response ?? undefined,
        by: profileNames.get(row.author_id) ?? "Scolaris",
        date: row.created_at,
      })));
    };
    void refresh();

const mapMode = (m: string) =>
  ({ especes: "Espèces", mobile_money: "Mobile money", virement: "Virement", cheque: "Chèque" } as Record<string, string>)[m] ?? m;
// Mise à jour ultra-rapide : une seule requête pour les paiements
const refreshPayments = async () => {
  const sid = schoolIdRef.current;
  if (!sid) return;
  const { data } = await client.from("payments").select("*").eq("school_id", sid).order("created_at", { ascending: false });
  if (!alive || !data) return;
  setPayments(data.map((row) => ({
    id: row.id,
    receipt: row.receipt_number,
    studentId: row.student_id,
    amount: row.amount,
    mode: mapMode(row.mode),
    period: row.period,
    note: row.note,
    status: row.status,
    reason: row.void_reason ?? undefined,
    trancheDue: row.tranche_due ?? undefined,
    cancelledBy: row.cancelled_by ?? undefined,
    cancelledAt: row.cancelled_at ?? undefined,
    secretaryId: row.secretary_id,
    by: profileNamesRef.current.get(row.created_by) ?? row.created_by,
    date: row.created_at,
  })));
};
// Regroupe les rafales d'événements en une seule actualisation complète
let timer: ReturnType<typeof setTimeout> | undefined;
const scheduleRefresh = () => {
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => void refresh(), 300);
};
// Filet de sécurité : retour sur l'onglet, reconnexion, et vérification périodique
const onVisible = () => { if (document.visibilityState === "visible") void refresh(); };
const onOnline = () => void refresh();
document.addEventListener("visibilitychange", onVisible);
window.addEventListener("online", onOnline);
const poll = setInterval(() => { if (document.visibilityState === "visible") void refresh(); }, 20000);

const channel = client.channel(`school-${userId}`)
  .on("postgres_changes", { event: "*", schema: "public", table: "payments" }, () => void refreshPayments())
  .on("postgres_changes", { event: "*", schema: "public", table: "students" }, scheduleRefresh)
  .on("postgres_changes", { event: "*", schema: "public", table: "classes" }, scheduleRefresh)
  .on("postgres_changes", { event: "*", schema: "public", table: "reports" }, scheduleRefresh)
  .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, scheduleRefresh)
  .on("postgres_changes", { event: "*", schema: "public", table: "user_roles" }, scheduleRefresh)
  .on("postgres_changes", { event: "INSERT", schema: "public", table: "activity_log" }, (payload) => {
    const item = payload.new as { action?: string; details?: Record<string, unknown> };
    if (role === "founder" && item.action?.startsWith("Paiement ")) {
      setUnreadPayments((count) => count + 1);
      toast(item.action, { description: JSON.stringify(item.details ?? {}) });
    }
    scheduleRefresh();
  })
  .subscribe();
return () => {
  alive = false;
  if (timer) clearTimeout(timer);
  clearInterval(poll);
  document.removeEventListener("visibilitychange", onVisible);
  window.removeEventListener("online", onOnline);
  void client.removeChannel(channel);
};
  }, [userId, role]);

  const validPayments = useMemo(
    () => payments.filter((p) => p.status === "valid"),
    [payments],
  );
  const getStudent = (id: string) => students.find((s) => s.id === id);
  const paid = (id: string) =>
    validPayments
      .filter((p) => p.studentId === id)
      .reduce((sum, p) => sum + p.amount, 0);
  const due = (s: Student) => {
    const c = classes.find((row) => row.id === s.classId) ?? classes.find((row) => row.name === s.className);
    return Math.max(0, (c?.registration ?? 0) + (c?.tuition ?? 0) - s.discount);
  };
  const remaining = (s: Student) => Math.max(0, due(s) - paid(s.id));
  const status = (s: Student) => {
    const rem = remaining(s),
      lastValidPayment = validPayments
        .filter((p) => p.studentId === s.id)
        .sort((a, b) => b.date.localeCompare(a.date))[0],
      classDue = lastValidPayment?.trancheDue ??
        (classes.find((c) => c.id === s.classId) ?? classes.find((c) => c.name === s.className))?.due ?? "2026-12-31",
      late = Math.max(
        0,
        Math.floor(
          (Date.now() - new Date(`${classDue}T23:59:59`).getTime()) / 86400000,
        ),
      );
    if (!rem) return { label: "À jour", tone: "good" };
    if (late) return { label: `En retard · ${late} j`, tone: "late" };
    if (paid(s.id)) return { label: "Partiel", tone: "partial" };
    return { label: "Impayé", tone: "muted" };
  };
  const totalDue = students.reduce((sum, s) => sum + due(s), 0),
    totalPaid = students.reduce((sum, s) => sum + paid(s.id), 0);
  const focusedStudent = getStudent(studentId),
    focusedPayment = payments.find((p) => p.id === paymentId);
  const addLog = (action: string, detail: string) =>
    setLogs((rows) => [
      {
        id: crypto.randomUUID(),
        action,
        detail,
        by: role === "secretary" ? "Fatou Diallo" : "Kouassi Aya",
        date: new Date().toISOString(),
        secretaryId: role === "secretary" ? userId || "demo-secretary" : undefined,
      },
      ...rows,
    ]);
  const go = (next: Page) => {
    if (next === "history") setUnreadPayments(0);
    setPage(next);
    setMenuOpen(false);
    setQuery("");
  };
  const exportCsv = (rows: string[][], name: string) => {
    const content =
      "\uFEFF" +
      rows
        .map((row) =>
          row
            .map((value) => `"${String(value).replaceAll('"', '""')}"`)
            .join(";"),
        )
        .join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(
      new Blob([content], { type: "text/csv;charset=utf-8" }),
    );
    a.download = name;
    a.click();
    URL.revokeObjectURL(a.href);
  };
  const isSecretary = role === "secretary";
  const structureOptions = role === "founder"
    ? userId
      ? teamMembers.filter((member) => member.role === "secretary").sort((a, b) => (a.structureNumber ?? 0) - (b.structureNumber ?? 0))
      : demoTeam.filter((member) => member.role === "secretary").sort((a, b) => (a.structureNumber ?? 0) - (b.structureNumber ?? 0))
    : [];

  const selectedSecretaryId = role === "secretary"
    ? userId || "demo-secretary"
    : structureFilter === "all" ? "" : structureFilter;
  const visibleClasses = classes.filter((row) => !selectedSecretaryId || (row.secretaryId ?? "demo-secretary") === selectedSecretaryId);
  const visibleStudents = students.filter((row) => !selectedSecretaryId || (row.secretaryId ?? "demo-secretary") === selectedSecretaryId);
  const visiblePayments = payments.filter((row) => !selectedSecretaryId || (row.secretaryId ?? "demo-secretary") === selectedSecretaryId);
  const selectedSecretaryName = teamMembers.find((member) => member.id === selectedSecretaryId)?.name ?? (selectedSecretaryId === "demo-secretary" ? "Fatou Diallo" : "");
  const visibleLogs = logs.filter((row) => !selectedSecretaryId || row.secretaryId === selectedSecretaryId || (!row.secretaryId && row.by === selectedSecretaryName));
  const visibleValidPayments = visiblePayments.filter((row) => row.status === "valid");
  const visibleTotalDue = visibleStudents.reduce((sum, row) => sum + due(row), 0);
  const visibleTotalPaid = visibleStudents.reduce((sum, row) => sum + paid(row.id), 0);

  const authenticate = async (email: string, password: string) => {
    if (!supabase) throw new Error("Configurez Supabase pour vous connecter à un compte réel.");
    const login = email.trim().toLowerCase();
    const identifier = login.includes("@") ? login : `${login}@${SECRETARY_DOMAIN}`;
    const { data, error } = await supabase.auth.signInWithPassword({ email: identifier, password });
    if (error) throw error;
    const { data: roleRow, error: roleError } = await supabase.from("user_roles").select("role").eq("user_id", data.user.id).maybeSingle();
    if (roleError || (roleRow?.role !== "founder" && roleRow?.role !== "secretary")) {
      await supabase.auth.signOut();
      throw new Error("Aucun rôle actif n’est associé à ce compte.");
    }
    clearAccountData();
    setDemoMode(false);
    setUserId(data.user.id);
    setCloudSession(true);
    setRole(roleRow.role);
  };
  const registerFounder = async (schoolName: string, fullName: string, email: string, password: string) => {
    if (!supabase) throw new Error("Configurez Supabase pour créer votre établissement.");
    const { data, error } = await supabase.functions.invoke("create-founder", {
      body: { school_name: schoolName, full_name: fullName, email, password },
    });
    if (error) throw error;
    const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
      access_token: data.access_token,
      refresh_token: data.refresh_token,
    });
    if (sessionError || !sessionData.session) throw sessionError ?? new Error("Connexion automatique impossible.");
    clearAccountData();
    setDemoMode(false);
    setUserId(sessionData.session.user.id);
    setCloudSession(true);
    setRole("founder");
    toast.success("Établissement créé. Vous êtes connecté comme fondateur.");
  };

  const logout = async () => {
    if (supabase && cloudSession) await supabase.auth.signOut();
    setRole(null);
    setUserId("");
    setCloudSession(false);
    setPage("dashboard");
try { localStorage.removeItem("scolaris-nav"); } catch {}
    if (supabase) {
      clearAccountData();
      setDemoMode(false);
    } else {
      setDemoMode(true);
      loadDemoData();
    }
  };
  if (authLoading) return <Spinner full />;
  if (!role) return <Login onLogin={async (nextRole) => {
    if (supabase) await supabase.auth.signOut();
    setCloudSession(false);
    setUserId("");
    setDemoMode(true);
    loadDemoData();
    setRole(nextRole);
  }} onAuthenticate={authenticate} onRegister={registerFounder} />;

  const groups: { title: string; items: NavItem[] }[] = [
    {
      title: "École",
      items: [
        { id: "dashboard", label: "Tableau de bord", Icon: LayoutDashboard },
        { id: "students", label: "Élèves", Icon: Users },
        { id: "payments", label: "Paiements", Icon: CreditCard },
        { id: "debts", label: "Impayés", Icon: CircleDollarSign },
      ],
    },
    {
      title: "Suivi",
      items: [
        { id: "history", label: "Historique", Icon: FileClock },
        { id: "reports", label: "Signalements", Icon: Bell },
      ],
    },
    {
      title: "Administration",
      items: [
        { id: "classes", label: "Classes & frais", Icon: BookOpen },
        ...(role === "founder"
          ? [{ id: "team" as Page, label: "Équipe", Icon: UserRoundPlus }]
          : []),
      ],
    },
  ] as const;
  const titles: Record<Page, string> = {
    dashboard: "Tableau de bord",
    students: "Élèves",
    payments: "Paiements",
    debts: "Impayés",
    history: "Historique",
    reports: "Signalements",
    classes: "Classes & frais",
    team: "Équipe",
    student: "Fiche élève",
    receipt: "Reçu de paiement",
  };
  const filteredStudents = visibleStudents.filter(
    (s) =>
      `${s.lastName} ${s.firstNames} ${s.matricule} ${s.className}`
        .toLowerCase()
        .includes(query.toLowerCase()) &&
      (classFilter === "Toutes les classes" || s.className === classFilter),
  );
  const createPayment = async (data: {
    studentId: string;
    amount: number;
    mode: string;
    period: string;
    note: string;
    trancheDue?: string;
  }) => {
    if (role !== "secretary") {
      toast.error("Seule la secrétaire peut encaisser un paiement.");
      return;
    }
    const client = supabase;
    const existing = payments.find((row) => row.id === paymentId && row.status === "valid");
    let p: Payment;
    if (client && userId && cloudSchoolId) {
      const values = {
        amount: data.amount,
        mode: data.mode,
        period: data.period,
        note: data.note,
        tranche_due: data.trancheDue ?? null,
      };
      const request = existing
        ? client.from("payments").update(values).eq("id", existing.id).eq("school_id", cloudSchoolId)
        : client.from("payments").insert({
            school_id: cloudSchoolId,
            secretary_id: userId,
            student_id: data.studentId,
            ...values,
            created_by: userId,
          });
      const { data: saved, error } = await request.select("*").single();
      if (error) {
        toast.error(error.message);
        return;
      }
      p = {
        id: saved.id,
        receipt: saved.receipt_number,
        studentId: saved.student_id,
        amount: saved.amount,
        mode: ({ especes: "Espèces", mobile_money: "Mobile money", virement: "Virement", cheque: "Chèque" } as Record<string, string>)[saved.mode] ?? saved.mode,
        period: saved.period,
        note: saved.note,
        status: saved.status,
        reason: saved.void_reason ?? undefined,
        trancheDue: saved.tranche_due ?? undefined,
        cancelledBy: saved.cancelled_by ?? undefined,
        cancelledAt: saved.cancelled_at ?? undefined,
        secretaryId: saved.secretary_id,
        by: existing?.by ?? teamMembers.find((member) => member.id === userId)?.name ?? "Secrétaire",
        date: saved.created_at,
      };
    } else {
      p = {
        ...data,
        id: existing?.id ?? crypto.randomUUID(),
        receipt: existing?.receipt ?? `REC-${1001 + payments.length}`,
        mode: ({ especes: "Espèces", mobile_money: "Mobile money", virement: "Virement", cheque: "Chèque" } as Record<string, string>)[data.mode] ?? data.mode,
        trancheDue: data.trancheDue,
        status: "valid",
        by: existing?.by ?? "Fatou Diallo",
        date: existing?.date ?? new Date().toISOString(),
        secretaryId: existing?.secretaryId ?? "demo-secretary",
      };
    }
    const id = p.id;
    setPayments((rows) => existing ? rows.map((row) => row.id === id ? p : row) : [p, ...rows]);
    const s = getStudent(data.studentId);
    if (!userId) addLog(existing ? "Paiement modifié" : "Paiement enregistré", `${s?.firstNames} ${s?.lastName} · ${data.period} · ${money(data.amount)}`);
    setModal(null);
    setPaymentId(id);
    setPage("receipt");
    toast.success(existing ? "Paiement modifié" : "Paiement enregistré");
  };

  const matriculePrefix = `MAT-${new Date().getFullYear()}-S${teamMembers.find((member) => member.id === userId)?.structureNumber ?? 1}-`;
  const classKey = (c: SchoolClass) => c.id ?? `${c.secretaryId ?? "local"}-${c.name}`;
  const listClass = classes.find((c) => classKey(c) === listClassKey);
  const createSession = async (draft: { levelName: string; name: string; registration: string; tuition: string; due: string }) => {
    if (role !== "secretary") {
      toast.error("Seule la secrétaire peut créer une session.");
      return;
    }
    const name = draft.name.trim();
    const ownerId = userId || "demo-secretary";
    if (classes.some((c) => c.name.toLowerCase() === name.toLowerCase() && (c.secretaryId ?? "demo-secretary") === ownerId)) {
      toast.error("Cette classe existe déjà. Ouvrez-la depuis « Classes & frais » pour compléter sa liste.");
      return;
    }
    const added: SchoolClass = {
      levelName: draft.levelName.trim(),
      name,
      registration: Number(draft.registration),
      tuition: Number(draft.tuition),
      due: draft.due,
      secretaryId: ownerId,
    };
    if (supabase && userId && cloudSchoolId) {
      const { data, error } = await supabase.from("classes").insert({
        school_id: cloudSchoolId,
        secretary_id: userId,
        level_name: added.levelName,
        name: added.name,
        registration_fee: added.registration,
        tuition_fee: added.tuition,
        due_date: added.due,
      }).select("id").single();
      if (error) { toast.error(error.code === "23505" ? "Cette classe existe déjà." : error.message); return; }
      added.id = data.id;
    } else {
      addLog("Classe ajoutée", added.name);
    }
    setClasses((rows) => [...rows, added]);
    setListClassKey(classKey(added));
    setModal("list");
    toast.success("Session créée. Saisissez maintenant les élèves.");
  };
  const saveStudentBatch = async (cls: SchoolClass, drafts: StudentDraft[]) => {
    type Result = { ok: boolean; id?: string; matricule?: string; error?: string };
    if (role !== "secretary") {
      return drafts.map((): Result => ({ ok: false, error: "Seule la secrétaire peut inscrire des élèves." }));
    }
    const ownerId = userId || "demo-secretary";
    const prefix = matriculePrefix;
    const taken: string[] = [];
    const nextMatricule = () => {
      const max = [...students.map((row) => row.matricule), ...taken]
        .filter((value) => value.startsWith(prefix))
        .reduce((highest, value) => Math.max(highest, Number(value.slice(prefix.length)) || 0), 0);
      const value = `${prefix}${String(max + 1).padStart(4, "0")}`;
      taken.push(value);
      return value;
    };
    const results: Result[] = [];
    const saved: Student[] = [];
    for (const d of drafts) {
      const existing = d.id ? students.find((row) => row.id === d.id) : undefined;
      const explicit = d.matricule.trim();
      const matricule = explicit || nextMatricule();
      if (explicit) taken.push(explicit);
      const s: Student = {
        ...existing,
        id: existing?.id ?? crypto.randomUUID(),
        matricule,
        lastName: d.lastName.trim(),
        firstNames: d.firstNames.trim(),
        sex: d.sex,
        className: cls.name,
        levelName: cls.levelName ?? cls.name,
        classId: cls.id ?? existing?.classId,
        secretaryId: existing?.secretaryId ?? ownerId,
        year: existing?.year ?? (schoolInfo.year || "2026-2027"),
        parent: existing?.parent ?? "",
        phone: d.phone.trim(),
        discount: Number(d.discount) || 0,
        joined: existing?.joined ?? new Date().toISOString().slice(0, 10),
      };
      if (supabase && userId && cloudSchoolId) {
        const values = {
          school_id: cloudSchoolId,
          matricule: s.matricule,
          last_name: s.lastName,
          first_names: s.firstNames,
          sex: s.sex,
          class_id: cls.id,
          secretary_id: s.secretaryId ?? userId,
          school_year: s.year,
          parent_name: s.parent,
          parent_phone: s.phone,
          discount: s.discount,
          enrolled_at: s.joined,
        };
        const request = existing
          ? supabase.from("students").update(values).eq("id", s.id).eq("school_id", cloudSchoolId)
          : supabase.from("students").insert(values);
        const { data, error } = await request.select("id").single();
        if (error) {
          results.push({ ok: false, error: error.code === "23505" ? "Ce matricule existe déjà" : error.message });
          continue;
        }
        if (!existing) s.id = data.id;
      }
      saved.push(s);
      results.push({ ok: true, id: s.id, matricule: s.matricule });
    }
    if (saved.length) {
      setStudents((rows) => {
        const byId = new Map(saved.map((row) => [row.id, row]));
        const known = new Set(rows.map((row) => row.id));
        return [...rows.map((row) => byId.get(row.id) ?? row), ...saved.filter((row) => !known.has(row.id))];
      });
      if (!userId) addLog("Liste d’élèves enregistrée", `${cls.name} · ${saved.length} élève(s)`);
      toast.success(`${saved.length} élève${saved.length > 1 ? "s" : ""} enregistré${saved.length > 1 ? "s" : ""}`);
    }
    const failed = results.filter((row) => !row.ok).length;
    if (failed) toast.error(`${failed} ligne${failed > 1 ? "s" : ""} non enregistrée${failed > 1 ? "s" : ""}`);
    return results;
  };

  return (
    <div className="app-shell">
      {menuOpen && (
        <button
          className="scrim"
          aria-label="Fermer le menu"
          onClick={() => setMenuOpen(false)}
        />
      )}
      <aside className={`sidebar ${menuOpen ? "sidebar-open" : ""}`}>
        <div className="brand">
          <span className="brand-mark">
            <GraduationCap size={22} />
          </span>
          <b>Scolaris</b>
          <i>.</i>
        </div>
        <div className="school-switch">
          <span className="school-logo">LL</span>
          <span>
            <b>École Les Lauriers</b>
            <small>Abidjan · 2026–2027</small>
          </span>
          <ChevronDown size={15} />
        </div>
        <nav>
          {groups.map((group) => (
            <section className="nav-group" key={group.title}>
              <h3>{group.title}</h3>
              {group.items.map(({ id, label, Icon }) => (
                <button
                  key={id}
                  className={`nav-link ${page === id || (id === "students" && page === "student") || (id === "payments" && page === "receipt") ? "active" : ""}`}
                  onClick={() => go(id as Page)}
                >
                  <Icon size={17} />
                  <span>{label}</span>
                  {id === "reports" &&
                    reports.some((r) => r.status === "open") && (
                      <i className="nav-count">
                        {reports.filter((r) => r.status === "open").length}
                      </i>
                    )}
                </button>
              ))}
            </section>
          ))}
        </nav>
        <div className="sidebar-end">
          <div className="secure-note">
            <ShieldCheck size={17} />
            <span>
              <b>Données protégées</b>
              <small>Votre école, vos données.</small>
            </span>
          </div>
          <button className="nav-link" onClick={() => go("classes")}>
            <Settings2 size={17} />
            <span>Paramètres de l’école</span>
          </button>
          <div className="profile">
            <span className="avatar">{isSecretary ? "FD" : "KA"}</span>
            <span>
              <b>{isSecretary ? "Fatou Diallo" : "Kouassi Aya"}</b>
              <small>{isSecretary ? "Secrétaire" : "Fondatrice"}</small>
            </span>
            <button title="Déconnexion" onClick={() => void logout()}>
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>
      <main className="main-area">
        <header className="topbar">
          <div className="crumb">
            <button
              className="icon-btn mobile-menu"
              aria-label="Menu"
              onClick={() => setMenuOpen(true)}
            >
              <Menu size={20} />
            </button>
            <span>École</span>
            <ChevronRight size={14} />
            <b>{titles[page]}</b>
          </div>
          <div className="top-actions">
            {role === "founder" && (
              <select
                className="structure-select"
                value={structureFilter}
                onChange={(event) => setStructureFilter(event.target.value)}
                aria-label="Filtrer par structure"
              >
                <option value="all">Toutes les structures</option>
                {structureOptions.map((member) => (
                  <option value={member.id} key={member.id}>
                    Structure {member.structureNumber} — {member.name} ({member.sessionPeriod || "—"})
                  </option>
                ))}
              </select>
            )}
            <span className={`online ${online ? "" : "offline"}`}>
              {online ? <Wifi size={14} /> : <WifiOff size={14} />}
              <span>{online ? "En ligne" : "Hors ligne"}</span>
            </span>
            <i className="top-divider" />
            <button
              className="icon-btn"
              aria-label={role === "founder" ? "Historique des paiements" : "Signalements"}
              onClick={() => go(role === "founder" ? "history" : "reports")}
            >
              <Bell size={18} />
              {(role === "founder" ? unreadPayments > 0 : reports.some((r) => r.status === "open")) && (
                <i className="notification-dot">{role === "founder" && unreadPayments > 0 ? unreadPayments : ""}</i>
              )}
            </button>
            <button
              className="icon-btn"
              title="Déconnexion"
              aria-label="Déconnexion"
              onClick={() => void logout()}
            >
              <LogOut size={18} />
            </button>
            <span className="avatar avatar-small">
              {isSecretary ? "FD" : "KA"}
            </span>
          </div>
        </header>
        {!dataReady && <Spinner />}
<div className="content" style={dataReady ? undefined : { display: "none" }}>
          {page === "dashboard" && (
            <Dashboard
              students={visibleStudents}
              classes={visibleClasses}
              payments={visibleValidPayments}
              logs={visibleLogs}
              due={due}
              paid={paid}
              totalDue={visibleTotalDue}
              totalPaid={visibleTotalPaid}
              isSecretary={isSecretary}
              onGo={go}
              onCollect={() => { setStudentId(""); setPaymentId(""); setModal("payment"); }}
              onStudent={(id: string) => {
                setStudentId(id);
                go("student");
              }}
            />
          )}
          {page === "students" && (
            <StudentsView
              students={filteredStudents}
              allStudents={visibleStudents}
              query={query}
              setQuery={setQuery}
              classFilter={classFilter}
              setClassFilter={setClassFilter}
              classes={visibleClasses}
              due={due}
              paid={paid}
              remaining={remaining}
              status={status}
              isSecretary={isSecretary}
              onAdd={() => setModal("session")}
              onEditList={(c: SchoolClass) => { setListClassKey(classKey(c)); setModal("list"); }}
              onEdit={(id: string) => { setStudentId(id); setStudentClassName(""); setModal("student"); }}
              onOpen={(id: string) => {
                setStudentId(id);
                go("student");
              }}
              onExport={() =>
                exportCsv(
                  [
                    [
                      "Matricule",
                      "Élève",
                      "Session",
                      "Classe",
                      "Sexe",
                    ],
                    ...filteredStudents.map((s) => [
                      s.matricule,
                      `${s.firstNames} ${s.lastName}`,
                      s.levelName ?? s.className,
                      s.className,
                      s.sex,
                    ]),
                  ],
                  "scolaris-eleves.csv",
                )
              }
            />
          )}
          {page === "student" && focusedStudent && (
            <StudentView
              student={focusedStudent}
              payments={payments.filter(
                (p) => p.studentId === focusedStudent.id,
              )}
              due={due(focusedStudent)}
              paid={paid(focusedStudent.id)}
              remaining={remaining(focusedStudent)}
              isSecretary={isSecretary}
              onBack={() => go("students")}
              onCollect={() => { setPaymentId(""); setModal("payment"); }}
              onEditPayment={(id: string) => { setPaymentId(id); setModal("payment"); }}
              onReport={() => setModal("report")}
              onReceipt={(id: string) => {
                setPaymentId(id);
                go("receipt");
              }}
              onEdit={() =>
                setModal("student")
              }
            />
          )}
          {page === "payments" && (
            <PaymentsView
              payments={visiblePayments}
              students={visibleStudents}
              query={query}
              setQuery={setQuery}
              isSecretary={isSecretary}
              onCollect={() => {
                setStudentId("");
                setPaymentId("");
                setModal("payment");
              }}
              onEdit={(id: string) => { setPaymentId(id); setModal("payment"); }}
              onVoid={(id: string) => {
                setPaymentId(id);
                setModal("void");
              }}
              onReceipt={(id: string) => {
                setPaymentId(id);
                go("receipt");
              }}
              onExport={() =>
                exportCsv(
                  [
                    [
                      "Reçu",
                      "Date",
                      "Élève",
                      "Classe",
                      "Période",
                      "Échéance tranche",
                      "Mode",
                      "Montant",
                      "Statut",
                      "Encaissé par",
                    ],
                    ...visiblePayments.map((p) => {
                      const s = getStudent(p.studentId);
                      return [
                        p.receipt,
                        dateLabel(p.date),
                        `${s?.firstNames ?? ""} ${s?.lastName ?? ""}`,
                        s?.className ?? "",
                        p.period,
                        p.trancheDue ? dateLabel(p.trancheDue) : "",
                        p.mode,
                        String(p.amount),
                        p.status === "valid" ? "Valide" : "Annulé",
                        p.by,
                      ];
                    }),
                  ],
                  "scolaris-paiements.csv",
                )
              }
            />
          )}
          {page === "debts" && (
            <DebtsView
              students={visibleStudents}
              filter={debtFilter}
              setFilter={setDebtFilter}
              due={due}
              paid={paid}
              remaining={remaining}
              status={status}
              classes={visibleClasses}
              onOpen={(id: string) => {
                setStudentId(id);
                go("student");
              }}
              onExport={() =>
                exportCsv(
                  [
                    [
                      "Matricule",
                      "Élève",
                      "Classe",
                      "Échéance",
                      "Exigible",
                      "Payé",
                      "Reste",
                      "Statut",
                    ],
                    ...visibleStudents.map((s) => [
                      s.matricule,
                      `${s.firstNames} ${s.lastName}`,
                      s.className,
                      dateLabel(
                        visibleClasses.find((c) => c.id === s.classId)?.due ?? visibleClasses.find((c) => c.name === s.className)?.due ?? "",
                      ),
                      String(due(s)),
                      String(paid(s.id)),
                      String(remaining(s)),
                      status(s).label,
                    ]),
                  ],
                  "scolaris-soldes.csv",
                )
              }
            />
          )}
          {page === "history" && <HistoryView logs={logs} />}
          {page === "reports" && (
            <ReportsView
              reports={reports}
              students={students}
              isSecretary={isSecretary}
              onNew={() => setModal("report")}
              onResolve={async (id: string, response: string) => {
                if (supabase && userId) {
                  const { error } = await supabase
                    .from("reports")
                    .update({ status: "treated", secretary_response: response, treated_by: userId })
                    .eq("id", id);
                  if (error) { toast.error(error.message); return; }
                }
                setReports((rows) =>
                  rows.map((r) =>
                    r.id === id ? { ...r, status: "treated", response } : r,
                  ),
                );
                if (!userId) addLog("Signalement traité", response || "Sans réponse");
                toast.success("Signalement marqué comme traité");
              }}
            />
          )}
          {page === "classes" && (
            <ClassesView
              classes={visibleClasses}
              students={visibleStudents}
              setClasses={setClasses}
              isSecretary={isSecretary}
              onLog={addLog}
              schoolInfo={schoolInfo}
              schoolId={cloudSchoolId}
              classIds={cloudClassIds}
              userId={userId}
              onSchoolSave={setSchoolInfo}
              onEnroll={(className: string) => {
                const target = visibleClasses.find((row) => row.name === className);
                if (target) { setListClassKey(classKey(target)); setModal("list"); }
              }}
            />
          )}
          {page === "team" && role === "founder" && (
            <TeamView
              payments={validPayments}
              members={userId ? teamMembers : demoTeam}
              onAdd={() => setModal("staff")}
              onToggle={async (id: string, active: boolean) => {
                if (supabase && userId) {
                  const { error } = await supabase.rpc("set_secretary_active", { _user_id: id, _active: active });
                  if (error) { toast.error(error.message); return; }
                  setTeamMembers((rows) => rows.map((member) => member.id === id ? { ...member, active } : member));
                } else {
                  setDemoTeam((rows) => rows.map((member) => member.id === id ? { ...member, active } : member));
                }
                toast.success(active ? "Compte réactivé" : "Compte désactivé");
              }}
              onUpdatePeriod={async (id: string, sessionPeriod: string) => {
                if (supabase && userId) {
                  const { error } = await supabase.functions.invoke("create-secretary", { body: { action: "update_period", secretary_id: id, session_period: sessionPeriod } });
                  if (error) { toast.error(error.message); return; }
                  setTeamMembers((rows) => rows.map((member) => member.id === id ? { ...member, sessionPeriod } : member));
                } else {
                  setDemoTeam((rows) => rows.map((member) => member.id === id ? { ...member, sessionPeriod } : member));
                }
                toast.success("Période mise à jour");
              }}
              onResetPassword={async (id: string) => {
                const target = (userId ? teamMembers : demoTeam).find((member) => member.id === id);
                if (!target) return;
                const newPassword = window.prompt(`Nouveau mot de passe pour ${target.name} (8 caractères minimum) :`);
                if (!newPassword) return;
                if (newPassword.length < 8) { toast.error("Le mot de passe doit contenir au moins 8 caractères."); return; }
                if (supabase && userId) {
                  const { error } = await supabase.functions.invoke("create-secretary", { body: { action: "reset_password", secretary_id: id, new_password: newPassword } });
                  if (error) { toast.error(await functionError(error)); return; }
                }
                toast.success("Mot de passe mis à jour");
              }}
              onDelete={async (id: string) => {
                const target = (userId ? teamMembers : demoTeam).find((member) => member.id === id);
                if (!target || !window.confirm(`Supprimer définitivement l’accès de ${target.name} et ses données ?`)) return;
                if (supabase && userId) {
                  const { error } = await supabase.functions.invoke("create-secretary", { body: { action: "delete", secretary_id: id } });
                  if (error) { toast.error(error.message); return; }
                  setTeamMembers((rows) => rows.filter((member) => member.id !== id));
                  setStudents((rows) => rows.filter((student) => student.secretaryId !== id));
                  setPayments((rows) => rows.filter((payment) => payment.secretaryId !== id));
                  setClasses((rows) => rows.filter((classRow) => classRow.secretaryId !== id));
                } else {
                  setDemoTeam((rows) => rows.filter((member) => member.id !== id));
                }
                toast.success("Accès supprimé");
              }}
            />
          )}
          {page === "receipt" && focusedPayment && (
            <ReceiptView
              payment={focusedPayment}
              student={getStudent(focusedPayment.studentId)}
              schoolInfo={schoolInfo}
              classInfo={classes.find(
                (c) =>
                  c.name === getStudent(focusedPayment.studentId)?.className,
              )}
              remaining={getStudent(focusedPayment.studentId)
                ? Math.max(0, due(getStudent(focusedPayment.studentId)!) - validPayments
                  .filter((row) => row.studentId === focusedPayment.studentId && new Date(row.date) <= new Date(focusedPayment.date))
                  .reduce((sum, row) => sum + row.amount, 0))
                : 0}
              onBack={() => go("payments")}
            />
          )}
        </div>
      </main>
      {modal === "payment" && (
        <PaymentModal
          students={students}
          due={due}
          paid={paid}
          selectedId={studentId}
          payment={payments.find((row) => row.id === paymentId && row.status === "valid")}
          onClose={() => setModal(null)}
          onSubmit={createPayment}
        />
      )}
      {modal === "void" && focusedPayment && (
        <VoidModal
          payment={focusedPayment}
          onClose={() => setModal(null)}
          onConfirm={async (reason: string) => {
            if (supabase && userId) {
              const { error } = await supabase
                .from("payments")
                .update({ status: "void", void_reason: reason })
                .eq("id", paymentId)
                .eq("school_id", cloudSchoolId);
              if (error) { toast.error(error.message); return; }
            }
            setPayments((rows) =>
              rows.map((p) =>
                p.id === paymentId ? { ...p, status: "void", reason, cancelledBy: userId || "demo-secretary", cancelledAt: new Date().toISOString() } : p,
              ),
            );
            if (!userId) addLog("Paiement annulé", `${focusedPayment.receipt} · Motif : ${reason}`);
            setModal(null);
            toast.success("Paiement annulé. La trace est conservée.");
          }}
        />
      )}
      {modal === "student" && (
        <StudentModal
          classes={visibleClasses}
          nextId={students.length + 1}
          student={studentId ? getStudent(studentId) : undefined}
          presetClassName={studentClassName}
          ownerId={userId || "demo-secretary"}
          onClose={() => setModal(null)}
          onSubmit={async (s: Student) => {
            const editing = students.some((row) => row.id === s.id);
            if (supabase && userId && cloudSchoolId) {
              const values = {
                school_id: cloudSchoolId,
                matricule: s.matricule,
                last_name: s.lastName,
                first_names: s.firstNames,
                sex: s.sex,
                class_id: classes.find((row) => row.name === s.className)?.id ?? s.classId,
                secretary_id: s.secretaryId ?? userId,
                school_year: s.year,
                parent_name: s.parent,
                parent_phone: s.phone,
                discount: s.discount,
                enrolled_at: s.joined,
              };
              const request = editing
                ? supabase.from("students").update(values).eq("id", s.id).eq("school_id", cloudSchoolId)
                : supabase.from("students").insert(values);
              const { data, error } = await request.select("id").single();
              if (error) {
                toast.error(error.code === "23505" ? "Ce matricule existe déjà" : error.message);
                return;
              }
              if (!editing) s = { ...s, id: data.id, secretaryId: userId };
            }
            setStudents((rows) => editing ? rows.map((row) => row.id === s.id ? s : row) : [...rows, s]);
            if (!userId) addLog(editing ? "Élève modifié" : "Élève ajouté", `${s.firstNames} ${s.lastName} · ${s.matricule}`);
            setModal(null);
            toast.success(editing ? "Fiche élève mise à jour" : "Élève ajouté");
          }}
        />
      )}
      {modal === "session" && (
        <SessionModal
          onClose={() => setModal(null)}
          onSubmit={createSession}
        />
      )}
      {modal === "list" && listClass && (
        <StudentsListModal
          classRow={listClass}
          allStudents={students}
          matriculePrefix={matriculePrefix}
          students={students.filter((row) => listClass.id ? row.classId === listClass.id : row.className === listClass.name)}
          onClose={() => setModal(null)}
          onSave={saveStudentBatch}
        />
      )}
      {modal === "report" && (
        <ReportModal
          students={students}
          selectedId={page === "student" ? studentId : ""}
          onClose={() => setModal(null)}
          onSubmit={async (id: string, message: string) => {
            let reportId = crypto.randomUUID();
            if (supabase && userId && cloudSchoolId) {
              const { data, error } = await supabase.from("reports").insert({
                school_id: cloudSchoolId,
                student_id: id || null,
                message,
                author_id: userId,
              }).select("id").single();
              if (error) { toast.error(error.message); return; }
              reportId = data.id;
            }
            setReports((rows) => [
              {
                id: reportId,
                studentId: id,
                message,
                status: "open",
                by: isSecretary ? "Fatou Diallo" : "Kouassi Aya",
                date: new Date().toISOString(),
              },
              ...rows,
            ]);
            if (!userId) addLog("Signalement créé", message);
            setModal(null);
            go("reports");
            toast.success("Signalement envoyé");
          }}
        />
      )}
      {modal === "staff" && (
        <StaffModal
          onClose={() => setModal(null)}
          onSubmit={async (fullName: string, username: string, password: string, sessionPeriod: string) => {
            const cleanUsername = username.trim().toLowerCase();
            const internalEmail = `${cleanUsername}@${SECRETARY_DOMAIN}`;
            if (supabase && userId) {
              const { data, error } = await supabase.functions.invoke("create-secretary", {
                body: { full_name: fullName, username: cleanUsername, temporary_password: password, session_period: sessionPeriod },
              });
              if (error) { toast.error(await functionError(error)); return; }
              const number = teamMembers.filter((member) => member.role === "secretary").length + 1;
              setTeamMembers((rows) => [...rows, { id: data.id, name: fullName, email: data.email ?? internalEmail, role: "secretary", active: true, sessionPeriod, createdAt: new Date().toISOString(), structureNumber: data.structure_number ?? number }]);
            } else {
              const number = nextDemoStructureNumber;
              setNextDemoStructureNumber((value) => value + 1);
              setDemoTeam((rows) => [...rows, { id: crypto.randomUUID(), name: fullName, email: internalEmail, role: "secretary", active: true, sessionPeriod, structureNumber: number }]);
            }
            setModal(null);
            toast.success("Compte secrétaire créé");
          }}
        />
      )}
    </div>
  );
}

function Login({
  onLogin,
  onAuthenticate,
  onRegister,
}: {
  onLogin: (r: Role) => void;
  onAuthenticate: (email: string, password: string) => Promise<void>;
  onRegister: (school: string, name: string, email: string, password: string) => Promise<void>;
}) {
  const [create, setCreate] = useState(false);
  return (
    <div className="login">
      <section className="login-intro">
        <div className="brand">
          <span className="brand-mark">
            <GraduationCap size={23} />
          </span>
          <b>Scolaris</b>
          <i>.</i>
        </div>
        <div className="intro-copy">
          <span className="eyebrow">GESTION SCOLAIRE, EN TOUTE CLARTÉ</span>
          <h1>
            Chaque élève mérite
            <br />
            un suivi <em>sans oubli.</em>
          </h1>
          <p>
            Les frais, les reçus et les échéances de votre école, réunis dans un
            seul espace.
          </p>
          <div className="intro-numbers">
            <div>
              <b>12</b>
              <span>élèves suivis</span>
            </div>
            <i />
            <div>
              <b>3</b>
              <span>classes actives</span>
            </div>
            <i />
            <div>
              <b>1</b>
              <span>équipe sereine</span>
            </div>
          </div>
        </div>
        <small className="login-copy">
          © 2026 Scolaris · Abidjan, Côte d’Ivoire
        </small>
      </section>
      <section className="login-form-area">
        <div className="login-card">
          <div className="mobile-brand">
            <span className="brand-mark">
              <GraduationCap size={21} />
            </span>
            <b>Scolaris</b>
          </div>
          <span className="eyebrow">
            {create ? "NOUVEL ÉTABLISSEMENT" : "BONJOUR À VOUS"}
          </span>
          <h2>{create ? "Créer mon établissement" : "Connexion"}</h2>
          <p className="login-sub">
            {create
              ? "Votre espace de gestion commence ici."
              : "Retrouvez le suivi de votre école."}
          </p>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const fields = new FormData(e.currentTarget);
              const value = (key: string) => String(fields.get(key) ?? "");
              try {
                if (create) {
                  await onRegister(value("school"), value("name"), value("email"), value("password"));
                } else {
                  await onAuthenticate(value("email"), value("password"));
                }
              } catch (error) {
                toast.error(error instanceof Error ? error.message : "Connexion impossible.");
              }
            }}
          >
            {create && (
              <Field name="school" label="Nom de l’école" placeholder="École Les Lauriers" />
            )}
            {create && (
              <Field name="name" label="Votre nom" placeholder="Nom et prénoms" />
            )}
            <Field
              name="email"
              label={create ? "Adresse e-mail" : "Identifiant ou e-mail"}
              placeholder={create ? "nom@ecole.com" : "identifiant ou nom@ecole.com"}
              type={create ? "email" : "text"}
            />
            <Field
              name="password"
              label="Mot de passe"
              placeholder="••••••••••"
              type="password"
            />
            <button className="btn primary full">
              {create ? "Créer mon établissement" : "Se connecter"}{" "}
              <ArrowUpRight size={15} />
            </button>
          </form>
          {create ? (
            <button
              className="text-btn centered"
              onClick={() => setCreate(false)}
            >
              Retour à la connexion
            </button>
          ) : (
            <button
              className="text-btn centered"
              onClick={() => setCreate(true)}
            >
              Créer un établissement <ChevronRight size={14} />
            </button>
          )}
          <div className="demo">
            <div className="demo-title">
              <span>✳</span>
              <div>
                <b>Connexion rapide de démonstration</b>
                <small>Explorez les deux profils de l’école</small>
              </div>
            </div>
            <button onClick={() => onLogin("founder")}>
              <i className="demo-avatar gold">KA</i>
              <span>
                <b>Fondateur démo</b>
                <small>Kouassi Aya · lecture seule</small>
              </span>
              <ArrowUpRight size={15} />
            </button>
            <button onClick={() => onLogin("secretary")}>
              <i className="demo-avatar green">FD</i>
              <span>
                <b>Secrétaire démo</b>
                <small>Fatou Diallo · gestion complète</small>
              </span>
              <ArrowUpRight size={15} />
            </button>
            <small className="demo-disclaimer">
              Accès de démonstration local, sans authentification serveur.
            </small>
          </div>
        </div>
      </section>
    </div>
  );
}
function Field({
  name,
  label,
  placeholder,
  type = "text",
}: {
  name: string;
  label: string;
  placeholder: string;
  type?: string;
}) {
  return (
    <label className="field">
      {label}
      <input required name={name} type={type} placeholder={placeholder} />
    </label>
  );
}

function PageHeading({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: React.ReactNode;
  description: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {children && <div className="heading-buttons">{children}</div>}
    </div>
  );
}
function Button({
  children,
  onClick,
  secondary = false,
}: {
  children: React.ReactNode;
  onClick: () => void;
  secondary?: boolean;
}) {
  return (
    <ShadcnButton
      type="button"
      variant={secondary ? "outline" : "default"}
      className={`btn ${secondary ? "secondary" : "primary"}`}
      onClick={onClick}
    >
      {children}
    </ShadcnButton>
  );
}
function DownloadButton({ onClick }: { onClick: () => void }) {
  return (
    <Button secondary onClick={onClick}>
      <Download size={15} /> Exporter CSV
    </Button>
  );
}
function Dashboard({
  students,
  classes,
  payments,
  logs,
  due,
  paid,
  totalDue,
  totalPaid,
  isSecretary,
  onGo,
  onCollect,
  onStudent,
}: any) {
  const paidCount = students.filter(
      (s: Student) => paid(s.id) >= due(s),
    ).length,
    partialCount = students.filter(
      (s: Student) => paid(s.id) > 0 && paid(s.id) < due(s),
    ).length,
    unpaid = students.length - paidCount - partialCount;
  const day = new Date().toISOString().slice(0, 10),
    today = payments
      .filter((p: Payment) => p.date.slice(0, 10) === day)
      .reduce((a: number, p: Payment) => a + p.amount, 0),
    month = payments
      .filter((p: Payment) => p.date.slice(0, 7) === day.slice(0, 7))
      .reduce((a: number, p: Payment) => a + p.amount, 0);
  return (
    <>
      <PageHeading
        eyebrow="MARDI 13 OCTOBRE 2026 · COCODY"
        title={
          <>
            Bonjour, Fatou <i className="gold-dot">.</i>
          </>
        }
        description="Voici la situation financière de votre école."
      >
        {isSecretary && (
          <Button onClick={onCollect}>
            <Plus size={16} /> Encaisser un paiement
          </Button>
        )}
      </PageHeading>
      <div className="metrics">
        {[
          [
            "Élèves inscrits",
            students.length,
            "Année scolaire 2026–2027",
            Users,
            "teal",
          ],
          [
            "À jour",
            paidCount,
            `${Math.round((paidCount / (students.length || 1)) * 100)} % des élèves`,
            CheckCheck,
            "green",
          ],
          [
            "Paiements partiels",
            partialCount,
            "Un solde reste à régler",
            CircleDollarSign,
            "amber",
          ],
          [
            "Sans paiement",
            unpaid,
            "À relancer en priorité",
            ClipboardList,
            "gray",
          ],
        ].map(([label, value, sub, Icon, tone]: any) => (
          <article className={`metric ${tone}`} key={label}>
            <div>
              <span>{label}</span>
              <i>
                <Icon size={17} />
              </i>
            </div>
            <strong>{value}</strong>
            <small>{sub}</small>
          </article>
        ))}
      </div>
      <div className="dash-grid">
        <section className="panel finance">
          <PanelTitle title="Suivi des frais" sub="Année scolaire 2026–2027" />
          <div className="money-pair">
            <div>
              <span>Total exigible</span>
              <b>{money(totalDue)}</b>
            </div>
            <div>
              <span>Encaissé à ce jour</span>
              <b className="green-text">{money(totalPaid)}</b>
            </div>
          </div>
          <div className="progress">
            <i
              style={{
                width: `${totalDue ? Math.min(100, (totalPaid / totalDue) * 100) : 0}%`,
              }}
            />
          </div>
          <div className="progress-label">
            <span>
              {totalDue ? Math.round((totalPaid / totalDue) * 100) : 0} %
              encaissé
            </span>
            <b>Reste {money(totalDue - totalPaid)}</b>
          </div>
          <div className="receipts">
            <div>
              <i className="today-dot" />
              <span>Aujourd’hui</span>
              <b>{money(today)}</b>
            </div>
            <div>
              <i className="month-dot" />
              <span>Ce mois</span>
              <b>{money(month)}</b>
            </div>
            <div>
              <i className="week-dot" />
              <span>Cette semaine</span>
              <b>
                {money(
                  payments
                    .filter(
                      (p: Payment) =>
                        Date.now() - new Date(p.date).getTime() < 604800000,
                    )
                    .reduce((a: number, p: Payment) => a + p.amount, 0),
                )}
              </b>
            </div>
          </div>
        </section>
        <section className="panel class-stats">
          <PanelTitle
            title="Progression par classe"
            sub="Encaissements sur le total exigible"
          />
          <div className="class-progress">
            {classes.map((c: SchoolClass, i: number) => {
              const set = students.filter(
                  (s: Student) => s.className === c.name,
                ),
                need = set.reduce((a: number, s: Student) => a + due(s), 0),
                collected = set.reduce(
                  (a: number, s: Student) => a + paid(s.id),
                  0,
                ),
                percent = Math.round((collected / (need || 1)) * 100);
              return (
                <div key={c.name}>
                  <div>
                    <b>
                      <i className={`class-color color-${i}`} />
                      {c.name}
                    </b>
                    <span>{set.length} élèves</span>
                    <strong>{percent}%</strong>
                  </div>
                  <div className="tiny-progress">
                    <i
                      className={`fill-${i}`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
      <section className="panel recent">
        <div className="panel-title">
          <div>
            <h2>Dernières opérations</h2>
            <p>Activités récentes de votre école</p>
          </div>
          <button className="inline-link" onClick={() => onGo("history")}>
            Tout l’historique <ArrowUpRight size={14} />
          </button>
        </div>
        <div className="recent-table">
          <div className="recent-head">
            <span>ACTIVITÉ</span>
            <span>DÉTAIL</span>
            <span>AUTEUR</span>
            <span>DATE</span>
            <span />
          </div>
          {logs.slice(0, 7).map((log: LogItem) => (
            <div className="recent-row" key={log.id}>
              <b>
                <i />
                {log.action}
              </b>
              <span>{log.detail}</span>
              <span className="author">
                <i>{initials(log.by)}</i>
                {log.by}
              </span>
              <time>{dateLabel(log.date)}</time>
              <button
                className="icon-btn"
                title="Historique"
                onClick={() => onGo("history")}
              >
                <ArrowUpRight size={14} />
              </button>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
function PanelTitle({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="panel-title">
      <div>
        <h2>{title}</h2>
        <p>{sub}</p>
      </div>
    </div>
  );
}

function SearchBar({
  query,
  setQuery,
  placeholder,
}: {
  query: string;
  setQuery: (v: string) => void;
  placeholder: string;
}) {
  return (
    <label className="search">
      <Search size={16} />
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
      />
    </label>
  );
}
function Status({ value }: { value: { label: string; tone: string } }) {
  return (
    <span className={`status ${value.tone}`}>
      <i />
      {value.label}
    </span>
  );
}
function StudentsView({
  students,
  allStudents,
  query,
  setQuery,
  classFilter,
  setClassFilter,
  classes,
  due,
  paid,
  remaining,
  status,
  isSecretary,
  onAdd,
  onEditList,
  onOpen,
  onEdit,
  onExport,
}: any) {
  const filterClass = classes.find((c: SchoolClass) => c.name === classFilter);
  return (
    <>
      <PageHeading
        eyebrow="ANNÉE SCOLAIRE 2026–2027"
        title="Élèves"
        description={`${allStudents.length} élèves inscrits dans votre établissement`}
      >
        <DownloadButton onClick={onExport} />
        {isSecretary && (
          <>
            {filterClass && (
              <Button secondary onClick={() => onEditList(filterClass)}>
                Modifier la liste · {filterClass.name}
              </Button>
            )}
            <Button onClick={onAdd}>
              <Plus size={16} /> Créer une session
            </Button>
          </>
        )}
      </PageHeading>
      <section className="panel table-panel">
        <div className="toolbar">
          <SearchBar
            query={query}
            setQuery={setQuery}
            placeholder="Rechercher un élève, matricule..."
          />
          <select
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
          >
            <option>Toutes les classes</option>
            {classes.map((c: SchoolClass) => (
              <option key={c.name}>{c.name}</option>
            ))}
          </select>
          <small>
            {students.length} résultat{students.length !== 1 ? "s" : ""}
          </small>
        </div>
        <div className="overflow">
          <table>
            <thead>
              <tr>
                <th>MATRICULE</th>
                <th>ÉLÈVE</th>
                <th>SESSION</th>
                <th>CLASSE</th>
                <th>SEXE</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {students.map((s: Student, i: number) => (
                <tr key={s.id} onClick={() => onOpen(s.id)}>
                  <td className="mono">{s.matricule}</td>
                  <td><Person student={s} index={i} showParent={false} /></td>
                  <td>{s.levelName || s.className}</td>
                  <td>
                    <span className="chip">{s.className}</span>
                  </td>
                  <td>{s.sex}</td>
                  <td className="student-row-actions">
                    {isSecretary ? <button className="text-btn" onClick={(event) => { event.stopPropagation(); onEdit(s.id); }}>Modifier</button> : <ChevronRight size={16} />}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!students.length && (
            <Empty text="Aucun élève ne correspond à votre recherche." />
          )}
        </div>
      </section>
    </>
  );
}
function Person({ student, index = 0, showParent = true }: { student: Student; index?: number; showParent?: boolean }) {
  return (
    <span className="person">
      <i className={`person-avatar p${index % 5}`}>
        {initials(`${student.firstNames} ${student.lastName}`)}
      </i>
      <span>
        <b>
          {student.firstNames} {student.lastName}
        </b>
        {showParent && <small>{student.parent ? `Parent : ${student.parent}` : student.sex}</small>}
      </span>
    </span>
  );
}
function Empty({ children, text }: { children?: string; text?: string }) {
  return (
    <div className="empty">
      <ClipboardList size={22} />
      <p>{children ?? text}</p>
    </div>
  );
}

function StudentView({
  student,
  payments,
  due,
  paid,
  remaining,
  isSecretary,
  onBack,
  onCollect,
  onReport,
  onReceipt,
  onEditPayment,
  onEdit,
}: any) {
  return (
    <>
      <button className="back" onClick={onBack}>
        <ArrowLeft size={15} /> Retour aux élèves
      </button>
      <div className="student-heading">
        <i className="student-large">
          {initials(`${student.firstNames} ${student.lastName}`)}
        </i>
        <div>
          <span className="eyebrow">FICHE ÉLÈVE · {student.matricule}</span>
          <h1>
            {student.firstNames} {student.lastName}
          </h1>
          <p>
            {student.className} · Année scolaire {student.year}
          </p>
        </div>
        <div className="heading-buttons">
          {isSecretary ? (
            <>
              <Button secondary onClick={onEdit}>
                <span>Modifier</span>
              </Button>
              <Button onClick={onCollect}>
                <Plus size={16} /> Encaisser
              </Button>
            </>
          ) : (
            <Button secondary onClick={onReport}>
              <Bell size={15} /> Signaler
            </Button>
          )}
        </div>
      </div>
      <div className="metrics student-metrics">
        {[
          [
            "Montant exigible",
            due,
            "Inscription + scolarité − réduction",
            "teal",
          ],
          ["Total payé", paid, "Paiements valides uniquement", "green"],
          ["Solde restant", remaining, "Échéance selon la classe", "amber"],
        ].map(([label, value, sub, tone]: any) => (
          <article className={`metric ${tone}`} key={label}>
            <div>
              <span>{label}</span>
              <i>
                <CircleDollarSign size={17} />
              </i>
            </div>
            <strong className="smaller-money">{money(value)}</strong>
            <small>{sub}</small>
          </article>
        ))}
      </div>
      <div className="student-detail-grid">
        <section className="panel detail-panel">
          <PanelTitle
            title="Informations de l’élève"
            sub="Inscription et coordonnées"
          />
          <div className="info-grid">
            {[
              ["Nom complet", `${student.firstNames} ${student.lastName}`],
              ["Matricule", student.matricule],
              ["Classe", student.className],
              ["Sexe", student.sex],
              ["Parent / tuteur", student.parent],
              ["Téléphone", student.phone],
              ["Réduction", money(student.discount)],
              ["Inscription", dateLabel(student.joined)],
            ].map(([label, value]) => (
              <div key={label}>
                <small>{label}</small>
                <b>{value || "—"}</b>
              </div>
            ))}
          </div>
        </section>
        <section className="panel detail-panel">
          <PanelTitle
            title="Relevé des paiements"
            sub={`${payments.length} opération${payments.length === 1 ? "" : "s"}`}
          />
          {payments.length ? (
            <div className="payment-list">
              {payments.map((p: Payment) => (
                <div className="payment-row-wrap" key={p.id}>
                  <button className="payment-entry" onClick={() => onReceipt(p.id)}>
                    <i><CreditCard size={16} /></i>
                    <span>
                      <b>{p.period}</b>
                      <small>{p.receipt} · {dateLabel(p.date)}{p.status === "void" ? " · ANNULÉ" : ""}</small>
                    </span>
                    <strong className={p.status === "void" ? "struck" : ""}>{money(p.amount)}</strong>
                    <ChevronRight size={14} />
                  </button>
                  {isSecretary && p.status === "valid" && <button className="text-btn" onClick={() => onEditPayment(p.id)}>Modifier</button>}
                </div>
              ))}
            </div>
          ) : (
            <Empty children="Aucun paiement enregistré pour cet élève." />
          )}
        </section>
      </div>
    </>
  );
}

function PaymentsView({
  payments,
  students,
  query,
  setQuery,
  isSecretary,
  onCollect,
  onEdit,
  onVoid,
  onReceipt,
  onExport,
}: any) {
  const [range, setRange] = useState("Toutes les dates");
  const get = (id: string) => students.find((s: Student) => s.id === id);
  const filtered = payments.filter((p: Payment) => {
    const s = get(p.studentId);
    return (
      `${p.receipt} ${s?.lastName} ${s?.firstNames} ${s?.matricule}`
        .toLowerCase()
        .includes(query.toLowerCase()) &&
      (range === "Toutes les dates" || p.date.slice(0, 7) === "2026-10")
    );
  });
  const total = filtered
    .filter((p: Payment) => p.status === "valid")
    .reduce((a: number, p: Payment) => a + p.amount, 0);
  return (
    <>
      <PageHeading
        eyebrow="ENCAISSEMENTS · ANNÉE 2026–2027"
        title="Paiements"
        description="Retrouvez chaque opération et son reçu associé."
      >
        <DownloadButton onClick={onExport} />
        {isSecretary && (
          <Button onClick={onCollect}>
            <Plus size={16} /> Encaisser
          </Button>
        )}
      </PageHeading>
      <div className="summary-strip">
        <div>
          <small>Total encaissé affiché</small>
          <b>{money(total)}</b>
        </div>
        <div>
          <small>Opérations</small>
          <b>{filtered.length}</b>
        </div>
        <div>
          <small>Annulés</small>
          <b>{filtered.filter((p: Payment) => p.status === "void").length}</b>
        </div>
      </div>
      <section className="panel table-panel">
        <div className="toolbar">
          <SearchBar
            query={query}
            setQuery={setQuery}
            placeholder="Reçu, élève, matricule..."
          />
          <select value={range} onChange={(e) => setRange(e.target.value)}>
            <option>Toutes les dates</option>
            <option>Ce mois</option>
          </select>
          <small>
            {filtered.length} opération{filtered.length !== 1 ? "s" : ""}
          </small>
        </div>
        <div className="overflow">
          <table>
            <thead>
              <tr>
                <th>REÇU</th>
                <th>ÉLÈVE</th>
                <th>DATE</th>
                <th>TRANCHE</th>
                <th>ÉCHÉANCE</th>
                <th>MODE</th>
                <th>MONTANT</th>
                <th>STATUT</th>
                <th>ENCAISSÉ PAR</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {filtered.map((p: Payment) => {
                const s = get(p.studentId);
                return (
                  <tr key={p.id}>
                    <td>
                      <button
                        className="receipt-link"
                        onClick={() => onReceipt(p.id)}
                      >
                        {p.receipt} <ArrowUpRight size={12} />
                      </button>
                    </td>
                    <td>
                      <span className="table-person">
                        {s?.firstNames} {s?.lastName}
                        <small>
                          {s?.className} · {s?.matricule}
                        </small>
                      </span>
                    </td>
                    <td>{dateLabel(p.date)}</td>
                    <td>{p.period}</td>
                    <td>{p.trancheDue ? dateLabel(p.trancheDue) : "—"}</td>
                    <td>{p.mode}</td>
                    <td className={p.status === "void" ? "struck" : ""}>
                      {money(p.amount)}
                    </td>
                    <td>
                      <Status
                        value={
                          p.status === "valid"
                            ? { label: "Valide", tone: "good" }
                            : { label: "Annulé", tone: "late" }
                        }
                      />
                    </td>
                    <td>{p.by}</td>
                    <td>
                      {isSecretary && p.status === "valid" && (
                        <span className="payment-actions">
                          <button className="text-btn" onClick={() => onEdit(p.id)}>Modifier</button>
                          <button className="cancel-link" onClick={() => onVoid(p.id)}>Annuler</button>
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {!filtered.length && <Empty children="Aucun paiement trouvé." />}
        </div>
      </section>
    </>
  );
}

function DebtsView({
  students,
  filter,
  setFilter,
  due,
  paid,
  remaining,
  status,
  classes,
  onOpen,
  onExport,
}: any) {
  const options = [
    "Tous les soldes",
    "En retard",
    "Partiels",
    "Rien payé",
    "À jour",
  ];
  const data = students
    .filter(
      (s: Student) =>
        filter === "Tous les soldes" ||
        (filter === "En retard" && status(s).tone === "late") ||
        (filter === "Partiels" && paid(s.id) > 0 && remaining(s) > 0) ||
        (filter === "Rien payé" && !paid(s.id)) ||
        (filter === "À jour" && !remaining(s)),
    )
    .sort((a: Student, b: Student) =>
      (
        classes.find((c: SchoolClass) => c.name === a.className)?.due ?? ""
      ).localeCompare(
        classes.find((c: SchoolClass) => c.name === b.className)?.due ?? "",
      ),
    );
  const count = (option: string) =>
    option === "Tous les soldes"
      ? students.length
      : option === "En retard"
        ? students.filter((s: Student) => status(s).tone === "late").length
        : option === "Partiels"
          ? students.filter((s: Student) => paid(s.id) > 0 && remaining(s) > 0)
              .length
          : option === "Rien payé"
            ? students.filter((s: Student) => !paid(s.id)).length
            : students.filter((s: Student) => !remaining(s)).length;
  return (
    <>
      <PageHeading
        eyebrow="SUIVI DES SOLDES"
        title="Impayés"
        description="Échéances, versements et soldes par élève."
      >
        <DownloadButton onClick={onExport} />
      </PageHeading>
      <div className="tabs">
        {options.map((option) => (
          <button
            className={filter === option ? "selected" : ""}
            key={option}
            onClick={() => setFilter(option)}
          >
            {option}
            <i>{count(option)}</i>
          </button>
        ))}
      </div>
      <section className="panel table-panel overflow">
        <table>
          <thead>
            <tr>
              <th>ÉLÈVE</th>
              <th>CLASSE</th>
              <th>ÉCHÉANCE</th>
              <th>EXIGIBLE</th>
              <th>PAYÉ</th>
              <th>RESTE</th>
              <th>STATUT</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {data.map((s: Student, i: number) => (
              <tr key={s.id} onClick={() => onOpen(s.id)}>
                <td>
                  <Person student={s} index={i} />
                </td>
                <td>
                  <span className="chip">{s.className}</span>
                </td>
                <td>
                  {dateLabel(
                    classes.find((c: SchoolClass) => c.name === s.className)
                      ?.due ?? "",
                  )}
                </td>
                <td>{money(due(s))}</td>
                <td>{money(paid(s.id))}</td>
                <td>{money(remaining(s))}</td>
                <td>
                  <Status value={status(s)} />
                </td>
                <td>
                  <ChevronRight size={15} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!data.length && <Empty children="Aucun élève dans cette catégorie." />}
      </section>
    </>
  );
}

function HistoryView({ logs }: { logs: LogItem[] }) {
  return (
    <>
      <PageHeading
        eyebrow="JOURNAL DE L’ÉTABLISSEMENT"
        title="Historique"
        description="Une trace de chaque action réalisée dans l’école."
      >
        <span className="small-count">
          <Activity size={15} />
          {logs.length} opérations
        </span>
      </PageHeading>
      <section className="panel timeline">
        {logs.map((log, i) => (
          <article key={log.id}>
            <i className={i === 0 ? "latest" : ""} />
            <div>
              <div>
                <b>{log.action}</b>
                <time>
                  {dateLabel(log.date)} ·{" "}
                  {new Intl.DateTimeFormat("fr-FR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  }).format(new Date(log.date))}
                </time>
              </div>
              <p>{log.detail}</p>
              <small>
                <i>{initials(log.by)}</i>
                {log.by}
              </small>
            </div>
          </article>
        ))}
      </section>
    </>
  );
}

function ReportsView({
  reports,
  students,
  isSecretary,
  onNew,
  onResolve,
}: any) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  return (
    <>
      <PageHeading
        eyebrow="ÉCHANGES ENTRE L’ÉQUIPE"
        title="Signalements"
        description="Les anomalies et demandes de suivi de l’école."
      >
        {!isSecretary && (
          <Button onClick={onNew}>
            <Plus size={16} /> Nouveau signalement
          </Button>
        )}
      </PageHeading>
      <div className="report-list">
        {reports.map((r: Report) => {
          const s = students.find((x: Student) => x.id === r.studentId);
          return (
            <article className="panel report" key={r.id}>
              <div className="report-top">
                <Status
                  value={
                    r.status === "open"
                      ? { label: "À traiter", tone: "partial" }
                      : { label: "Traité", tone: "good" }
                  }
                />
                <time>{dateLabel(r.date)}</time>
              </div>
              {s && (
                <small className="report-student">
                  <UserRound size={13} />
                  {s.firstNames} {s.lastName} · {s.matricule}
                </small>
              )}
              <p>{r.message}</p>
              <small className="report-author">
                Signalé par <b>{r.by}</b>
              </small>
              {r.response && (
                <div className="response">
                  <Check size={14} />
                  <span>
                    <b>Réponse de la secrétaire</b>
                    <small>{r.response}</small>
                  </span>
                </div>
              )}
              {isSecretary && r.status === "open" && (
                <div className="resolve">
                  <input
                    placeholder="Réponse facultative..."
                    value={answers[r.id] ?? ""}
                    onChange={(e) =>
                      setAnswers((a) => ({ ...a, [r.id]: e.target.value }))
                    }
                  />
                  <Button onClick={() => onResolve(r.id, answers[r.id] ?? "")}>
                    <Check size={14} /> Marquer traité
                  </Button>
                </div>
              )}
            </article>
          );
        })}
        {!reports.length && (
          <Empty children="Aucun signalement pour le moment." />
        )}
      </div>
    </>
  );
}

function ClassesView({ classes, students, setClasses, isSecretary, onLog, schoolInfo, schoolId, classIds, userId, onSchoolSave, onEnroll }: any) {
  const [editing, setEditing] = useState(false),
    [school, setSchool] = useState<SchoolInfo>(schoolInfo),
    [draft, setDraft] = useState({
      levelName: "",
      name: "",
      registration: "",
      tuition: "",
      due: "",
    });
  useEffect(() => setSchool(schoolInfo), [schoolInfo]);
  const saveClass = async (row: SchoolClass) => {
    const classId = row.id ?? classIds[row.name];
    if (supabase && userId && schoolId && classId) {
      const { error } = await supabase.from("classes").update({
        registration_fee: row.registration,
        tuition_fee: row.tuition,
        due_date: row.due,
      }).eq("id", classId).eq("school_id", schoolId);
      if (error) { toast.error(error.message); return; }
    }
    toast.success(`Frais ${row.name} enregistrés`);
  };
  const sortedClasses = [...classes].sort((a: SchoolClass, b: SchoolClass) =>
    (a.levelName ?? a.name).localeCompare(b.levelName ?? b.name, "fr", { numeric: true }) || a.name.localeCompare(b.name, "fr", { numeric: true }),
  );
  const updateClass = (target: SchoolClass, values: Partial<SchoolClass>) =>
    setClasses((rows: SchoolClass[]) => rows.map((row) =>
      (target.id ? row.id === target.id : row.name === target.name && row.secretaryId === target.secretaryId)
        ? { ...row, ...values }
        : row,
    ));
  return (
    <>
      <PageHeading
        eyebrow="PARAMÈTRES DE L’ÉTABLISSEMENT"
        title="Classes & frais"
        description="Coordonnées de l’école et tarifs par classe."
      >
        {isSecretary && (
          <Button
            secondary
            onClick={async () => {
              if (!editing) { setEditing(true); return; }
              if (supabase && userId && schoolId) {
                const { error } = await supabase.from("schools").update({
                  name: school.name,
                  address: school.address,
                  phone: school.phone,
                  default_school_year: school.year,
                }).eq("id", schoolId);
                if (error) { toast.error(error.message); return; }
              } else {
                onLog("École mise à jour", "Coordonnées de l’établissement");
              }
              onSchoolSave(school);
              setEditing(false);
              toast.success("Informations enregistrées");
            }}
          >
            {editing ? (
              <>
                <Check size={15} /> Enregistrer
              </>
            ) : (
              <>Modifier</>
            )}
          </Button>
        )}
      </PageHeading>
      <section className="panel settings-panel">
        <PanelTitle
          title="Informations de l’école"
          sub="Coordonnées affichées sur les reçus"
        />
        <div className="school-fields">
          {[
            ["Nom de l’établissement", "name"],
            ["Adresse", "address"],
            ["Téléphone", "phone"],
            ["Année scolaire par défaut", "year"],
          ].map(([label, key]) => (
            <label key={key}>
              {label}
              <input
                readOnly={!editing}
                value={(school as any)[key]}
                onChange={(e) =>
                  setSchool((s) => ({ ...s, [key]: e.target.value }))
                }
              />
            </label>
          ))}
        </div>
      </section>
      <section className="panel settings-panel class-panel">
        <PanelTitle
          title="Classes et frais de scolarité"
          sub="Montants en FCFA · échéance annuelle"
        />
        <div className="overflow">
          <table>
            <thead>
              <tr>
                <th>NIVEAU / SESSION</th>
                <th>CLASSE</th>
                <th>ÉLÈVES</th>
                <th>INSCRIPTION</th>
                <th>SCOLARITÉ</th>
                <th>ÉCHÉANCE</th>
                <th>TOTAL</th>
              </tr>
            </thead>
            <tbody>
              {sortedClasses.map((c: SchoolClass) => (
                <tr key={c.id ?? `${c.secretaryId ?? "local"}-${c.name}`}>
                  <td>
                    {isSecretary ? <input className="fee-input" value={c.levelName ?? ""} onChange={(e) => updateClass(c, { levelName: e.target.value })} onBlur={async () => {
                      if (supabase && userId && schoolId && c.id) {
                        const { error } = await supabase.from("classes").update({ level_name: c.levelName ?? "" }).eq("id", c.id).eq("school_id", schoolId);
                        if (error) toast.error(error.message);
                      }
                    }} /> : <span>{c.levelName || c.name}</span>}
                  </td>
                  <td><span className="chip">{c.name}</span></td>
                  <td>{students.filter((student: Student) => student.classId ? student.classId === c.id : student.className === c.name).length}</td>
                  <td>{isSecretary ? <input className="fee-input" type="number" min="0" value={c.registration} onChange={(e) => updateClass(c, { registration: Number(e.target.value) })} onBlur={() => void saveClass(c)} /> : money(c.registration)}</td>
                  <td>{isSecretary ? <input className="fee-input" type="number" min="0" value={c.tuition} onChange={(e) => updateClass(c, { tuition: Number(e.target.value) })} onBlur={() => void saveClass(c)} /> : money(c.tuition)}</td>
                  <td>{isSecretary ? <input className="fee-input" type="date" value={c.due} onChange={(e) => updateClass(c, { due: e.target.value })} onBlur={() => void saveClass(c)} /> : dateLabel(c.due)}</td>
                  <td>
                    <b>{money(c.registration + c.tuition)}</b>
                  </td>
                  <td>{isSecretary && <Button secondary onClick={() => onEnroll(c.name)}>Saisir les élèves</Button>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {isSecretary && (
          <form
            className="add-class"
            onSubmit={async (e) => {
              e.preventDefault();
              const added: SchoolClass = {
                levelName: draft.levelName.trim(),
                name: draft.name.toUpperCase(),
                registration: Number(draft.registration),
                tuition: Number(draft.tuition),
                due: draft.due,
                secretaryId: userId || "demo-secretary",
              };
              if (supabase && userId && schoolId) {
                const { data, error } = await supabase.from("classes").insert({
                  school_id: schoolId,
                  secretary_id: userId,
                  level_name: added.levelName,
                  name: added.name,
                  registration_fee: added.registration,
                  tuition_fee: added.tuition,
                  due_date: added.due,
                }).select("id").single();
                if (error) { toast.error(error.message); return; }
                added.id = data.id;
              } else {
                onLog("Classe ajoutée", added.name);
              }
              setClasses((rows: SchoolClass[]) => [...rows, added]);
              setDraft({ levelName: "", name: "", registration: "", tuition: "", due: "" });
              toast.success("Classe ajoutée");
            }}
          >
            <b>
              <Plus size={15} /> Ajouter une session de classe
            </b>
            <input required placeholder="Niveau (ex. 6ème)" value={draft.levelName} onChange={(e) => setDraft({ ...draft, levelName: e.target.value })} />
            <input
              required
              placeholder="Classe (ex. 6ème A)"
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            />
            <input
              required
              type="number"
              placeholder="Inscription"
              value={draft.registration}
              onChange={(e) =>
                setDraft({ ...draft, registration: e.target.value })
              }
            />
            <input
              required
              type="number"
              placeholder="Scolarité"
              value={draft.tuition}
              onChange={(e) => setDraft({ ...draft, tuition: e.target.value })}
            />
            <input
              required
              type="date"
              value={draft.due}
              onChange={(e) => setDraft({ ...draft, due: e.target.value })}
            />
            <button className="btn primary">
              <Plus size={14} /> Ajouter
            </button>
          </form>
        )}
      </section>
    </>
  );
}

function TeamView({ payments, members, onAdd, onToggle, onUpdatePeriod, onResetPassword, onDelete }: any) {
  const [editingPeriod, setEditingPeriod] = useState("");
  const [periodDraft, setPeriodDraft] = useState<Record<string, string>>({});
  return (
    <>
      <PageHeading
        eyebrow="ACCÈS À L’ÉTABLISSEMENT"
        title="Équipe"
        description="Gérez les accès et suivez les encaissements par membre."
      >
        <Button onClick={onAdd}>
          <UserRoundPlus size={16} /> Créer un compte secrétaire
        </Button>
      </PageHeading>
      <section className="panel table-panel">
        <div className="overflow">
          <table>
            <thead>
              <tr>
                <th>MEMBRE</th>
                <th>RÔLE</th>
                <th>STRUCTURE / PÉRIODE</th>
                <th>ENCAISSEMENTS</th>
                <th>TOTAL ENCAISSÉ</th>
                <th>ACCÈS</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {members.map((m: TeamMember, i: number) => {
                const founder = m.role === "founder";
                const own = founder
                  ? []
                  : payments.filter((p: Payment) => p.by === m.name);
                return (
                  <tr key={m.email}>
                    <td>
                      <span className="person">
                        <i className={`person-avatar p${i}`}>
                          {initials(m.name)}
                        </i>
                        <span>
                          <b>{m.name}</b>
                          <small>{founder ? m.email : `Identifiant : ${loginName(m.email)}`}</small>
                        </span>
                      </span>
                    </td>
                    <td><span className="chip">{founder ? "Fondatrice" : "Secrétaire"}</span></td>
                    <td>
                      {founder ? "—" : editingPeriod === m.id ? (
                        <span className="period-edit">
                          <input value={periodDraft[m.id] ?? m.sessionPeriod ?? ""} placeholder="Ex. 2026-2027" onChange={(event) => setPeriodDraft((values) => ({ ...values, [m.id]: event.target.value }))} />
                          <button className="text-btn" onClick={() => { const value = (periodDraft[m.id] ?? m.sessionPeriod ?? "").trim(); if (value) onUpdatePeriod(m.id, value); setEditingPeriod(""); }}>Enregistrer</button>
                        </span>
                      ) : (
                        <span className="period-cell">
                          <b>Structure {m.structureNumber ?? i} — {m.name} ({m.sessionPeriod || "—"})</b>
                          <small>Période : {m.sessionPeriod || "—"}</small>
                          <button className="text-btn" onClick={() => { setPeriodDraft((values) => ({ ...values, [m.id]: m.sessionPeriod ?? "" })); setEditingPeriod(m.id); }}>Modifier la période</button>
                        </span>
                      )}
                    </td>
                    <td>{own.length}</td>
                    <td>
                      {money(
                        own.reduce((a: number, p: Payment) => a + p.amount, 0),
                      )}
                    </td>
                    <td>
                      <Status
                        value={
                          founder || m.active
                            ? { label: "Actif", tone: "good" }
                            : { label: "Désactivé", tone: "late" }
                        }
                      />
                    </td>
                    <td className="team-actions">
                      {!founder && <>
                        <button className="btn secondary small" onClick={() => onToggle(m.id, !m.active)}>
                          {m.active ? "Désactiver" : "Réactiver"}
                        </button>
                        <button className="btn secondary small" onClick={() => onResetPassword(m.id)}>Changer le mot de passe</button>
                        <button className="btn danger small" onClick={() => onDelete(m.id)}>Supprimer l’accès</button>
                      </>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="team-note">
          <ShieldCheck size={15} /> Les droits sont appliqués par rôle et par
          établissement dans la base.
        </p>
      </section>
    </>
  );
}

function ReceiptView({ payment, student, classInfo, remaining, schoolInfo, onBack }: any) {
  return (
    <>
      <button className="back" onClick={onBack}>
        <ArrowLeft size={15} /> Retour aux paiements
      </button>
      <div className="receipt-titlebar">
        <div>
          <span className="eyebrow">DOCUMENT DE CAISSE</span>
          <h1>Reçu de paiement</h1>
        </div>
        <Button onClick={() => window.print()}>
          <Printer size={15} /> Imprimer / PDF
        </Button>
      </div>
      <article className="receipt-paper">
        {payment.status === "void" && <b className="void-stamp">REÇU ANNULÉ</b>}
        <div className="receipt-brand">
          <span className="brand-mark">
            <GraduationCap size={21} />
          </span>
          <span>
            <b>{schoolInfo.name}</b>
            <small>{schoolInfo.address} · {schoolInfo.phone}</small>
          </span>
          <span className="receipt-number">
            <small>N° DE REÇU</small>
            <b>{payment.receipt}</b>
          </span>
        </div>
        <div className="receipt-head">
          <b>REÇU DE PAIEMENT</b>
          <time>{dateLabel(payment.date)}</time>
        </div>
        <div className="receipt-student">
          <div>
            <small>REÇU DE</small>
            <b>
              {student?.firstNames} {student?.lastName}
            </b>
            <span>
              {student?.matricule} · {student?.className}
            </span>
          </div>
          <div>
            <small>ANNÉE SCOLAIRE</small>
            <b>{student?.year}</b>
            <span>Parent : {student?.parent}</span>
          </div>
        </div>
        <div className="receipt-lines">
          <div>
            <span>Tranche</span>
            <b>{payment.period}</b>
          </div>
          <div>
            <span>Échéance de la tranche</span>
            <b>{payment.trancheDue ? dateLabel(payment.trancheDue) : "—"}</b>
          </div>
          <div>
            <span>Mode de paiement</span>
            <b>{payment.mode}</b>
          </div>
          <div>
            <span>Frais de scolarité</span>
            <b>
              {classInfo
                ? money(
                    classInfo.registration +
                      classInfo.tuition -
                      (student?.discount ?? 0),
                  )
                : "—"}
            </b>
          </div>
          <div className="received">
            <span>Montant encaissé</span>
            <b>{money(payment.amount)}</b>
          </div>
          <div>
            <span>Solde après versement</span>
            <b>{money(remaining)}</b>
          </div>
        </div>
        <div className="receipt-amount">
          <small>ARRÊTÉ À LA SOMME DE</small>
          <b>{money(payment.amount)}</b>
        </div>
        {payment.note && <p className="receipt-note">Note : {payment.note}</p>}
        {payment.reason && (
          <p className="receipt-note">Motif d’annulation : {payment.reason}</p>
        )}
        <div className="receipt-sign">
          <span>
            Encaissé par <b>{payment.by}</b>
          </span>
          <span>
            Signature & cachet
            <i />
          </span>
        </div>
        <p className="thanks">Merci pour votre confiance.</p>
      </article>
    </>
  );
}

function Modal({
  title,
  subtitle,
  children,
  onClose,
  wide = false,
  lockBackdrop = false,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  onClose: () => void;
  wide?: boolean;
  lockBackdrop?: boolean;
}) {
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [onClose]);
  return (
    <div
      className="modal-shade"
      onMouseDown={(e) => {
        if (!lockBackdrop && e.target === e.currentTarget) onClose();
      }}
    >
      <section className={`modal ${wide ? "modal-wide" : ""}`} role="dialog" aria-modal="true">
        <header>
          <div>
            <h2>{title}</h2>
            <p>{subtitle}</p>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Fermer">
            <X size={18} />
          </button>
        </header>
        {children}
      </section>
    </div>
  );
}
function PaymentModal({
  students,
  due,
  paid,
  selectedId,
  payment,
  onClose,
  onSubmit,
}: any) {
  const [id, setId] = useState(payment?.studentId ?? selectedId),
    [amount, setAmount] = useState(payment ? String(payment.amount) : ""),
    [mode, setMode] = useState(payment ? paymentModeCode(payment.mode) : "especes"),
    [period, setPeriod] = useState(payment?.period ?? "1ère tranche"),
    [trancheDue, setTrancheDue] = useState(formatFrenchDate(payment?.trancheDue)),
    [dateError, setDateError] = useState(""),
    [note, setNote] = useState(payment?.note ?? "");
  const s = students.find((row: Student) => row.id === id),
    balance = s ? Math.max(0, due(s) - paid(s.id) + (payment?.status === "valid" ? payment.amount : 0)) : 0;
  return (
    <Modal
      title={payment ? "Modifier un paiement" : "Encaisser un paiement"}
      subtitle={payment ? `${payment.receipt} · mettez à jour la tranche ou le versement.` : "Enregistrez un versement et générez son reçu."}
      onClose={onClose}
    >
      <form
        className="form-grid"
        onSubmit={(e) => {
          e.preventDefault();
          const parsedDue = parseFrenchDate(trancheDue);
          if (parsedDue === undefined) {
            setDateError("Saisissez une date valide au format JJ/MM/AAAA.");
            return;
          }
          if (id && Number(amount) > 0)
            onSubmit({
              studentId: id,
              amount: Number(amount),
              mode,
              period,
              trancheDue: parsedDue ?? undefined,
              note,
            });
        }}
      >
        <label className="span-all">
          Élève
          <select required disabled={Boolean(payment)} value={id} onChange={(e) => setId(e.target.value)}>
            <option value="">Choisir un élève</option>
            {students.map((x: Student) => (
              <option value={x.id} key={x.id}>
                {x.firstNames} {x.lastName} · {x.matricule} · {x.className}
              </option>
            ))}
          </select>
        </label>
        {s && (
          <div className="balance-box span-all">
            {[
              ["Exigible", due(s)],
              ["Déjà payé", paid(s.id)],
              ["Reste", balance],
            ].map(([label, value]: any) => (
              <div key={label}>
                <small>{label}</small>
                <b>{money(value)}</b>
              </div>
            ))}
          </div>
        )}
        <label className="span-all">
          Montant versé
          <input
            required
            type="number"
            min="1"
            max={balance || undefined}
            placeholder="Ex. 50 000"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </label>
        <label>
          Mode de paiement
          <select value={mode} onChange={(e) => setMode(e.target.value)}>
            <option value="especes">Espèces</option>
            <option value="mobile_money">Mobile money</option>
            <option value="virement">Virement</option>
            <option value="cheque">Chèque</option>
          </select>
        </label>
        <label>
          Tranche
          <select required value={period} onChange={(e) => setPeriod(e.target.value)}>
            {!['1ère tranche', '2ème tranche', '3ème tranche', 'Inscription'].includes(period) && <option value={period}>{period}</option>}
            <option>1ère tranche</option>
            <option>2ème tranche</option>
            <option>3ème tranche</option>
            <option>Inscription</option>
          </select>
        </label>
        <label>
          Échéance de la tranche
          <input type="text" inputMode="numeric" placeholder="JJ/MM/AAAA" value={trancheDue} onChange={(e) => { setTrancheDue(e.target.value); setDateError(""); }} />
          {dateError && <small className="field-error">{dateError}</small>}
        </label>
        <label className="span-all">
          Note (facultatif)
          <textarea
            rows={2}
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </label>
        <div className="modal-actions span-all">
          <Button secondary onClick={onClose}>
            Annuler
          </Button>
          <button className="btn primary">
            <Check size={15} /> {payment ? "Enregistrer les modifications" : "Valider le paiement"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
function VoidModal({ payment, onClose, onConfirm }: any) {
  const [reason, setReason] = useState("");
  return (
    <Modal
      title="Annuler ce paiement ?"
      subtitle={`${payment.receipt} · ${money(payment.amount)}. La trace restera visible.`}
      onClose={onClose}
    >
      <form
        className="form-grid"
        onSubmit={(e) => {
          e.preventDefault();
          if (reason.trim().length >= 4) onConfirm(reason.trim());
        }}
      >
        <label className="span-all">
          Motif obligatoire
          <textarea
            required
            minLength={4}
            rows={4}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Expliquez pourquoi ce paiement doit être annulé..."
          />
        </label>
        <div className="modal-actions span-all">
          <Button secondary onClick={onClose}>
            Conserver
          </Button>
          <button className="btn danger" disabled={reason.trim().length < 4}>
            <X size={15} /> Confirmer l’annulation
          </button>
        </div>
      </form>
    </Modal>
  );
}
function StudentModal({ classes, nextId, student, presetClassName, ownerId, onClose, onSubmit }: any) {
  const [form, setForm] = useState({
    matricule: student?.matricule ?? `MAT-2026-${String(nextId).padStart(4, "0")}`,
    lastName: student?.lastName ?? "",
    firstNames: student?.firstNames ?? "",
    sex: student?.sex ?? "Fille",
    className: student?.className ?? presetClassName ?? classes[0]?.name ?? "",
    year: student?.year ?? "2026-2027",
    parent: student?.parent ?? "",
    phone: student?.phone ?? "",
    discount: String(student?.discount ?? 0),
    joined: student?.joined?.slice(0, 10) ?? new Date().toISOString().slice(0, 10),
  });
  const set = (key: string, value: string) =>
    setForm((v) => ({ ...v, [key]: value }));
  if (!student && !classes.length) {
    return (
      <Modal title="Ajouter un élève" subtitle="Une session est nécessaire avant l’inscription." onClose={onClose}>
        <p className="empty-session">Créez d’abord une session de classe.</p>
        <div className="modal-actions"><Button secondary onClick={onClose}>Fermer</Button></div>
      </Modal>
    );
  }
  return (
    <Modal
      title={student ? "Modifier la fiche élève" : "Ajouter un élève"}
      subtitle="Les frais sont calculés selon la classe et la réduction."
      onClose={onClose}
    >
      <form
        className="form-grid"
        onSubmit={(e) => {
          e.preventDefault();
          const selectedClass = classes.find((row: SchoolClass) => row.name === form.className);
          onSubmit({
            ...student,
            ...form,
            id: student?.id ?? crypto.randomUUID(),
            classId: selectedClass?.id ?? student?.classId,
            levelName: selectedClass?.levelName ?? student?.levelName ?? form.className,
            secretaryId: student?.secretaryId ?? ownerId,
            discount: Number(form.discount),
          });
        }}
      >
        <label>
          Matricule
          <input required placeholder="ex. MAT-2026-0001" value={form.matricule} onChange={(e) => set("matricule", e.target.value)} />
        </label>
        {[
          ["Nom", "lastName"],
          ["Prénoms", "firstNames"],
        ].map(([label, key]) => (
          <label key={key}>
            {label}
            <input
              required
              value={(form as any)[key]}
              onChange={(e) => set(key, e.target.value)}
            />
          </label>
        ))}
        <label>
          Classe
          <select
            value={form.className}
            onChange={(e) => set("className", e.target.value)}
          >
            {classes.map((c: SchoolClass) => (
              <option key={c.name}>{c.name}</option>
            ))}
          </select>
        </label>
        <label>
          Année scolaire
          <input required value={form.year} onChange={(e) => set("year", e.target.value)} />
        </label>
        <label>
          Sexe
          <select value={form.sex} onChange={(e) => set("sex", e.target.value)}>
            <option>Fille</option>
            <option>Garçon</option>
          </select>
        </label>
        <label>
          Parent / tuteur
          <input
            value={form.parent}
            onChange={(e) => set("parent", e.target.value)}
          />
        </label>
        <label>
          Téléphone
          <input
            value={form.phone}
            onChange={(e) => set("phone", e.target.value)}
          />
        </label>
        <label>
          Date d’inscription
          <input type="date" value={form.joined} onChange={(e) => set("joined", e.target.value)} />
        </label>
        <label className="span-all">
          Réduction (FCFA)
          <input
            type="number"
            min="0"
            value={form.discount}
            onChange={(e) => set("discount", e.target.value)}
          />
        </label>
        <div className="modal-actions span-all">
          <Button secondary onClick={onClose}>
            Annuler
          </Button>
          <button className="btn primary">
            {student ? <Check size={15} /> : <Plus size={15} />}
            {student ? "Enregistrer les modifications" : "Ajouter l’élève"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
function SessionModal({ onClose, onSubmit }: any) {
  const [form, setForm] = useState({
    levelName: "",
    name: "",
    registration: "",
    tuition: "",
    due: "",
  });
  const [busy, setBusy] = useState(false);
  const set = (key: string, value: string) =>
    setForm((v) => ({ ...v, [key]: value }));
  return (
    <Modal
      title="Créer une session"
      subtitle="Définissez la classe et ses frais, puis saisissez la liste des élèves."
      onClose={onClose}
    >
      <form
        className="form-grid"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          try {
            await onSubmit(form);
          } finally {
            setBusy(false);
          }
        }}
      >
        <label>
          Niveau / session
          <input required placeholder="ex. 6ème" value={form.levelName} onChange={(e) => set("levelName", e.target.value)} />
        </label>
        <label>
          Classe (salle)
          <input required placeholder="ex. 6ème A" value={form.name} onChange={(e) => set("name", e.target.value)} />
        </label>
        <label>
          Frais d’inscription (FCFA)
          <input required type="number" min="0" placeholder="ex. 25 000" value={form.registration} onChange={(e) => set("registration", e.target.value)} />
        </label>
        <label>
          Scolarité (FCFA)
          <input required type="number" min="0" placeholder="ex. 150 000" value={form.tuition} onChange={(e) => set("tuition", e.target.value)} />
        </label>
        <label className="span-all">
          Échéance
          <input required type="date" value={form.due} onChange={(e) => set("due", e.target.value)} />
        </label>
        <p className="form-hint span-all">
          <ShieldCheck size={15} /> Une classe correspond à une salle (ex. 6ème A, 6ème B). Vous saisirez ensuite les élèves en liste.
        </p>
        <div className="modal-actions span-all">
          <Button secondary onClick={onClose}>
            Annuler
          </Button>
          <button className="btn primary" disabled={busy}>
            <Check size={15} /> Valider et saisir les élèves
          </button>
        </div>
      </form>
    </Modal>
  );
}

type StudentDraft = {
  key: string;
  id?: string;
  matricule: string;
  lastName: string;
  firstNames: string;
  sex: string;
  phone: string;
  discount: string;
  base?: string;
  error?: string;
};
const emptyDraft = (): StudentDraft => ({
  key: crypto.randomUUID(),
  matricule: "",
  lastName: "",
  firstNames: "",
  sex: "Fille",
  phone: "",
  discount: "0",
});
const draftSig = (r: StudentDraft) =>
  [r.matricule.trim(), r.lastName.trim(), r.firstNames.trim(), r.sex, r.phone.trim(), r.discount].join("|");
const isBlankDraft = (r: StudentDraft) =>
  !r.lastName.trim() && !r.firstNames.trim() && !r.phone.trim();

function StudentsListModal({ classRow, students, allStudents, matriculePrefix, onClose, onSave }: any) {
  const nextMatricule = (taken: string[]) => {
    const max = [...allStudents.map((s: Student) => s.matricule), ...taken]
      .filter((value) => value.startsWith(matriculePrefix))
      .reduce((highest, value) => Math.max(highest, Number(value.slice(matriculePrefix.length)) || 0), 0);
    return `${matriculePrefix}${String(max + 1).padStart(4, "0")}`;
  };
  const makeRows = (count: number, taken: string[]) => {
    const used = [...taken];
    const created: StudentDraft[] = [];
    for (let i = 0; i < count; i++) {
      const matricule = nextMatricule(used);
      used.push(matricule);
      created.push({ ...emptyDraft(), matricule });
    }
    return created;
  };
  const [rows, setRows] = useState<StudentDraft[]>(() => {
    const existing: StudentDraft[] = students.map((s: Student) => {
      const draft: StudentDraft = {
        key: s.id,
        id: s.id,
        matricule: s.matricule,
        lastName: s.lastName,
        firstNames: s.firstNames,
        sex: s.sex,
        phone: s.phone,
        discount: String(s.discount),
      };
      return { ...draft, base: draftSig(draft) };
    });
    return [...existing, ...makeRows(existing.length ? 3 : 8, existing.map((r) => r.matricule))];
  });
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [focusKey, setFocusKey] = useState("");
  const filledCount = rows.filter((r) => !isBlankDraft(r)).length;

  const update = (key: string, patch: Partial<StudentDraft>) => {
    setRows((list) => list.map((r) => (r.key === key ? { ...r, ...patch, error: undefined } : r)));
    setDirty(true);
  };
  const addRows = (count: number) => {
    const created = makeRows(count, rows.map((r) => r.matricule));
    setRows([...rows, ...created]);
    setFocusKey(created[0].key);
  };
  const removeRow = (key: string) => setRows((list) => list.filter((r) => r.key !== key));
  const requestClose = () => {
    if (dirty && !window.confirm("Des modifications ne sont pas enregistrées. Quitter quand même ?")) return;
    onClose();
  };
  const save = async () => {
    const filled = rows.filter((r) => !isBlankDraft(r));
    if (!filled.length) {
      toast.error("Saisissez au moins un élève.");
      return;
    }
    const explicit = filled.map((r) => r.matricule.trim()).filter(Boolean);
    let invalid = false;
    const checked = rows.map((r) => {
      if (isBlankDraft(r)) return r;
      if (!r.lastName.trim() || !r.firstNames.trim()) {
        invalid = true;
        return { ...r, error: "Nom et prénoms obligatoires" };
      }
      const m = r.matricule.trim();
      if (m && explicit.filter((value) => value === m).length > 1) {
        invalid = true;
        return { ...r, error: "Matricule en double dans la liste" };
      }
      if (m && allStudents.some((s: Student) => s.matricule === m && s.id !== r.id)) {
        invalid = true;
        return { ...r, error: "Matricule déjà utilisé" };
      }
      return { ...r, error: undefined };
    });
    if (invalid) {
      setRows(checked);
      toast.error("Corrigez les lignes signalées.");
      return;
    }
    const toSave = filled.filter((r) => !r.id || r.base !== draftSig(r));
    if (!toSave.length) {
      onClose();
      return;
    }
    setSaving(true);
    try {
      const results: { ok: boolean; id?: string; matricule?: string; error?: string }[] = await onSave(classRow, toSave);
      const byKey = new Map(toSave.map((r, i) => [r.key, results[i]]));
      let failed = 0;
      const next = rows.map((r) => {
        const res = byKey.get(r.key);
        if (!res) return r;
        if (res.ok) {
          const savedRow: StudentDraft = { ...r, id: res.id, matricule: res.matricule ?? r.matricule, error: undefined };
          return { ...savedRow, base: draftSig(savedRow) };
        }
        failed += 1;
        return { ...r, error: res.error };
      });
      setRows(next);
      if (failed === 0) {
        setDirty(false);
        onClose();
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title={`Liste des élèves · ${classRow.name}`}
      subtitle={`${classRow.levelName || classRow.name} · Inscription ${money(classRow.registration)} · Scolarité ${money(classRow.tuition)}. Les lignes vides sont ignorées.`}
      onClose={requestClose}
      wide
      lockBackdrop
    >
      <div className="bulk-scroll">
        <table className="bulk-table">
          <thead>
            <tr>
              <th style={{ width: 34 }}>N°</th>
              <th style={{ width: 170 }}>MATRICULE (AUTO)</th>
              <th style={{ width: 150 }}>NOM</th>
              <th style={{ width: 170 }}>PRÉNOMS</th>
              <th style={{ width: 90 }}>SEXE</th>
              <th style={{ width: 130 }}>TÉLÉPHONE</th>
              <th style={{ width: 100 }}>RÉDUCTION</th>
              <th style={{ width: 150 }} />
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.key} className={r.error ? "has-error" : ""}>
                <td className="bulk-num">{i + 1}</td>
                <td>
                  <input
                    value={r.matricule}
                    placeholder="Auto"
                    onChange={(e) => update(r.key, { matricule: e.target.value })}
                  />
                </td>
                <td>
                  <input
                    autoFocus={r.key === focusKey}
                    value={r.lastName}
                    onChange={(e) => update(r.key, { lastName: e.target.value })}
                  />
                </td>
                <td>
                  <input
                    value={r.firstNames}
                    onChange={(e) => update(r.key, { firstNames: e.target.value })}
                  />
                </td>
                <td>
                  <select value={r.sex} onChange={(e) => update(r.key, { sex: e.target.value })}>
                    <option>Fille</option>
                    <option>Garçon</option>
                  </select>
                </td>
                <td>
                  <input
                    value={r.phone}
                    onChange={(e) => update(r.key, { phone: e.target.value })}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    min="0"
                    value={r.discount}
                    onChange={(e) => update(r.key, { discount: e.target.value })}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && i === rows.length - 1) {
                        e.preventDefault();
                        addRows(1);
                      }
                    }}
                  />
                </td>
                <td>
                  <span className="bulk-end">
                    {!r.id && (
                      <button
                        type="button"
                        className="icon-btn"
                        title="Retirer la ligne"
                        onClick={() => removeRow(r.key)}
                      >
                        <X size={14} />
                      </button>
                    )}
                    {r.error && <span className="bulk-error">⚠ {r.error}</span>}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="bulk-bar">
        <Button secondary onClick={() => addRows(1)}>
          <Plus size={14} /> Ajouter une ligne
        </Button>
        <Button secondary onClick={() => addRows(5)}>
          <Plus size={14} /> 5 lignes
        </Button>
        <small>
          {filledCount} élève{filledCount > 1 ? "s" : ""} renseigné{filledCount > 1 ? "s" : ""}
        </small>
      </div>
      <div className="modal-actions">
        <Button secondary onClick={requestClose}>
          Fermer
        </Button>
        <button className="btn primary" disabled={saving} onClick={() => void save()}>
          <Check size={15} /> {saving ? "Enregistrement..." : "Enregistrer la liste"}
        </button>
      </div>
    </Modal>
  );
}

function ReportModal({ students, selectedId, onClose, onSubmit }: any) {
  const [id, setId] = useState(selectedId),
    [message, setMessage] = useState("");
  return (
    <Modal
      title="Nouveau signalement"
      subtitle="Le signalement sera visible par la secrétaire."
      onClose={onClose}
    >
      <form
        className="form-grid"
        onSubmit={(e) => {
          e.preventDefault();
          if (message.trim()) onSubmit(id, message.trim());
        }}
      >
        <label className="span-all">
          Élève concerné (facultatif)
          <select value={id} onChange={(e) => setId(e.target.value)}>
            <option value="">Aucun élève</option>
            {students.map((s: Student) => (
              <option value={s.id} key={s.id}>
                {s.firstNames} {s.lastName} · {s.matricule}
              </option>
            ))}
          </select>
        </label>
        <label className="span-all">
          Votre message
          <textarea
            required
            minLength={6}
            rows={4}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Décrivez l’anomalie ou le point à vérifier..."
          />
        </label>
        <div className="modal-actions span-all">
          <Button secondary onClick={onClose}>
            Annuler
          </Button>
          <button className="btn primary">
            <Bell size={14} /> Envoyer
          </button>
        </div>
      </form>
    </Modal>
  );
}
function StaffModal({ onClose, onSubmit }: any) {
  return (
    <Modal
      title="Créer un compte secrétaire"
      subtitle="Un accès de gestion pour votre établissement."
      onClose={onClose}
    >
      <form
        className="form-grid"
        onSubmit={(e) => {
          e.preventDefault();
          const form = new FormData(e.currentTarget);
          onSubmit(
            String(form.get("full_name") ?? ""),
            String(form.get("username") ?? ""),
            String(form.get("temporary_password") ?? ""),
            String(form.get("session_period") ?? ""),
          );
        }}
      >
        <label className="span-all">
          Nom complet
          <input required name="full_name" placeholder="Nom et prénoms" />
        </label>
        <label className="span-all">
          Identifiant de connexion
          <input
            required
            name="username"
            minLength={3}
            maxLength={30}
            pattern="[a-zA-Z0-9][a-zA-Z0-9._\-]{2,29}"
            title="3 à 30 caractères : lettres, chiffres, point, tiret ou tiret bas (sans espace)"
            autoCapitalize="none"
            autoCorrect="off"
            placeholder="ex. fatou.diallo"
          />
        </label>
        <label className="span-all">
          Année / période
          <input required name="session_period" placeholder="Ex. 2026-2027" />
        </label>
        <label className="span-all">
          Mot de passe
          <input
            required
            name="temporary_password"
            minLength={8}
            type="password"
            placeholder="8 caractères minimum"
          />
        </label>
        <p className="form-hint span-all">
          <ShieldCheck size={15} /> Le compte sera rattaché à École Les
          Lauriers.
        </p>
        <div className="modal-actions span-all">
          <Button secondary onClick={onClose}>
            Annuler
          </Button>
          <button className="btn primary">
            <UserRoundPlus size={15} /> Créer le compte
          </button>
        </div>
      </form>
    </Modal>
  );
}