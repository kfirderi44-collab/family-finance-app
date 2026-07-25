import { useState } from 'react';
import { useAppData } from '../store/AppDataContext';
import { generateFamilyCode, type FirebaseWebConfig } from '../store/sync';
import { CloudOff, Cloud, CloudCog, AlertCircle, Copy, Check, Settings2 } from 'lucide-react';

const RULES_SNIPPET = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /families/{familyCode} {
      allow read, write: if true;
    }
  }
}`;

function parseFirebaseConfig(raw: string): FirebaseWebConfig | null {
  try {
    // Allow pasting the raw `const firebaseConfig = {...}` snippet too.
    const jsonLike = raw
      .replace(/^\s*(export\s+)?const\s+\w+\s*=\s*/m, '')
      .replace(/;\s*$/m, '')
      .trim();
    const withQuotedKeys = jsonLike.replace(/([{,]\s*)([A-Za-z_$][\w$]*)\s*:/g, '$1"$2":');
    const parsed = JSON.parse(withQuotedKeys);
    if (!parsed.apiKey || !parsed.projectId || !parsed.appId) return null;
    return parsed as FirebaseWebConfig;
  } catch {
    return null;
  }
}

export default function SettingsSection() {
  const { syncConfig, syncStatus, syncError, connectSync, disconnectSync } = useAppData();
  const [configText, setConfigText] = useState('');
  const [familyCode, setFamilyCode] = useState(syncConfig?.familyCode ?? '');
  const [formError, setFormError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleConnect = () => {
    setFormError(null);
    const parsed = parseFirebaseConfig(configText);
    if (!parsed) {
      setFormError('לא הצלחתי לקרוא את קונפיגורציית ה-Firebase. ודא/י שהדבקת את הקטע כולו.');
      return;
    }
    if (!familyCode.trim()) {
      setFormError('יש להזין או ליצור קוד משפחה.');
      return;
    }
    connectSync({ firebaseConfig: parsed, familyCode: familyCode.trim() });
  };

  const handleCopyRules = () => {
    navigator.clipboard.writeText(RULES_SNIPPET);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-cyan-100 dark:bg-cyan-900/40">
          <Settings2 size={20} className="text-cyan-600 dark:text-cyan-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold mb-1">הגדרות סנכרון</h2>
          <p className="text-sm text-slate-500">
            חברו את האפליקציה ל-Firebase כדי לסנכרן נתונים בזמן אמת בין כל המכשירים של המשפחה.
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 flex items-center gap-3">
        {syncStatus === 'off' && <CloudOff className="text-slate-400" size={22} />}
        {syncStatus === 'connecting' && <CloudCog className="text-amber-500 animate-pulse" size={22} />}
        {syncStatus === 'connected' && <Cloud className="text-emerald-600" size={22} />}
        {syncStatus === 'error' && <AlertCircle className="text-rose-500" size={22} />}
        <div className="flex-1">
          <div className="text-sm font-medium">
            {syncStatus === 'off' && 'סנכרון כבוי — הנתונים נשמרים רק במכשיר הזה'}
            {syncStatus === 'connecting' && 'מתחבר...'}
            {syncStatus === 'connected' && `מסונכרן — קוד משפחה: ${syncConfig?.familyCode}`}
            {syncStatus === 'error' && 'שגיאת חיבור'}
          </div>
          {syncError && <div className="text-xs text-rose-500 mt-0.5">{syncError}</div>}
        </div>
        {syncStatus !== 'off' && (
          <button
            onClick={disconnectSync}
            className="text-sm text-rose-600 hover:underline shrink-0"
          >
            ניתוק
          </button>
        )}
      </div>

      {syncStatus === 'off' && (
        <>
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 space-y-4">
            <div>
              <h3 className="font-semibold text-sm mb-2">שלב 1: יצירת פרויקט Firebase</h3>
              <ol className="text-sm text-slate-500 space-y-1 list-decimal pr-5">
                <li>
                  היכנס/י ל-
                  <a
                    href="https://console.firebase.google.com"
                    target="_blank"
                    rel="noreferrer"
                    className="text-cyan-600 hover:underline"
                  >
                    console.firebase.google.com
                  </a>
                  {' '}וצור/י פרויקט חדש
                </li>
                <li>בתפריט הצד: Build → Firestore Database → Create database (מצב production)</li>
                <li>בהגדרות הפרויקט (גלגל שיניים) → Your apps → הוסף/י אפליקציית ווב (&lt;/&gt;)</li>
                <li>העתק/י את קטע ה-firebaseConfig שמוצג והדבק/י אותו למטה</li>
              </ol>
            </div>

            <div>
              <h3 className="font-semibold text-sm mb-2">שלב 2: הרשאות Firestore</h3>
              <p className="text-sm text-slate-500 mb-2">
                בלשונית Rules של Firestore, הדביקו את הכללים הבאים ולחצו Publish:
              </p>
              <div className="relative">
                <pre className="text-xs bg-slate-50 dark:bg-slate-900 rounded-lg p-3 overflow-x-auto" dir="ltr">
                  {RULES_SNIPPET}
                </pre>
                <button
                  onClick={handleCopyRules}
                  className="absolute top-2 left-2 text-slate-400 hover:text-cyan-600"
                  aria-label="העתק"
                >
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                </button>
              </div>
              <p className="text-xs text-amber-600 mt-2">
                שימו לב: כלל זה פתוח לכל מי שמכיר את קוד המשפחה. מספיק לשימוש משפחתי פשוט.
              </p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 space-y-3">
            <h3 className="font-semibold text-sm">שלב 3: חיבור</h3>
            <div>
              <label className="text-xs text-slate-500">קונפיגורציית Firebase (הדבקה מלאה)</label>
              <textarea
                value={configText}
                onChange={(e) => setConfigText(e.target.value)}
                placeholder={'{\n  apiKey: "...",\n  authDomain: "...",\n  projectId: "...",\n  appId: "..."\n}'}
                rows={6}
                dir="ltr"
                className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-transparent px-3 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500">קוד משפחה</label>
              <div className="flex gap-2">
                <input
                  value={familyCode}
                  onChange={(e) => setFamilyCode(e.target.value)}
                  placeholder="לדוגמה: ABCD-1234"
                  dir="ltr"
                  className="flex-1 rounded-lg border border-slate-300 dark:border-slate-600 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
                <button
                  onClick={() => setFamilyCode(generateFamilyCode())}
                  className="rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-700"
                >
                  צור קוד חדש
                </button>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                השתמשו באותו קוד בכל המכשירים כדי לסנכרן ביניהם.
              </p>
            </div>
            {formError && <p className="text-sm text-rose-500">{formError}</p>}
            <button
              onClick={handleConnect}
              className="w-full rounded-lg bg-cyan-600 py-2.5 text-sm font-medium text-white hover:bg-cyan-700"
            >
              חיבור וסנכרון
            </button>
          </div>
        </>
      )}
    </div>
  );
}
