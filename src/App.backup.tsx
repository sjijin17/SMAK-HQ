import { useState } from 'react';
import {
  Archive,
  ArrowLeft,
  Check,
  FileText,
  LockKeyhole,
  Search,
  ShieldAlert,
  UnlockKeyhole,
  X,
} from 'lucide-react';

type Evidence = {
  id: string;
  title: string;
  type: string;
  locked?: boolean;
};

const evidence: Evidence[] = [
  {
    id: 'receipt',
    title: 'RECEIPT #7741',
    type: 'DOCUMENT',
  },
  {
    id: 'photo',
    title: 'PHOTOGRAPH',
    type: 'IMAGE',
  },
  {
    id: 'sealed',
    title: 'SEALED FILE',
    type: 'CLASSIFIED',
    locked: true,
  },
];

function normalizeAnswer(value: string) {
  return value.trim().toUpperCase().replace(/\s+/g, '');
}

export default function App() {
  const [openedEvidence, setOpenedEvidence] = useState<string | null>(null);
  const [inspectionComplete, setInspectionComplete] = useState(false);
  const [cipherAnswer, setCipherAnswer] = useState('');
  const [cipherSolved, setCipherSolved] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [message, setMessage] = useState('');

  const selectedEvidence = evidence.find(
    (item) => item.id === openedEvidence,
  );

  const openEvidence = (id: string) => {
    const item = evidence.find((entry) => entry.id === id);

    if (!item) return;

    if (item.locked && !unlocked) {
      setMessage('This evidence is locked. Something else must unlock it.');
      return;
    }

    setOpenedEvidence(id);
    setMessage('');
  };

  const inspectReceipt = () => {
    setInspectionComplete(true);
    setMessage(
      'A handwritten marking has been discovered beneath the printed total.',
    );
  };

  const solveCipher = () => {
    if (normalizeAnswer(cipherAnswer) === '7741') {
      setCipherSolved(true);
      setUnlocked(true);
      setMessage(
        'Correct. The sealed file has been unlocked and added to the evidence board.',
      );
      return;
    }

    setMessage('Incorrect code. The evidence suggests another attempt is possible.');
  };

  const resetPuzzle = () => {
    setOpenedEvidence(null);
    setInspectionComplete(false);
    setCipherAnswer('');
    setCipherSolved(false);
    setUnlocked(false);
    setMessage('');
  };

  return (
    <div className="min-h-screen bg-[#080a0c] text-[#e8e7e2]">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#0b0d0f]/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div>
            <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.25em] text-white/35">
              <ShieldAlert className="h-3.5 w-3.5" />
              SMAK ESCAPE ROOM
            </div>

            <h1 className="mt-1 text-lg font-bold tracking-tight sm:text-xl">
              CASE: THE LOCKED EVIDENCE
            </h1>
          </div>

          <div className="border border-amber-300/20 bg-amber-300/[0.04] px-3 py-2 text-right">
            <div className="text-[9px] uppercase tracking-[0.2em] text-white/30">
              Investigation Time
            </div>
            <div className="font-mono text-sm font-bold text-amber-200">
              44:32
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        <section className="mb-6 border border-white/10 bg-[#101316]">
          <div className="border-b border-white/10 px-5 py-4 sm:px-6">
            <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-amber-200/50">
              Investigation Brief
            </div>

            <h2 className="mt-2 text-xl font-bold">
              Something has been deliberately hidden.
            </h2>
          </div>

          <div className="max-w-3xl px-5 py-6 sm:px-6">
            <p className="text-sm leading-7 text-white/65">
              Your team has recovered several pieces of evidence. One file
              has been deliberately sealed. The only useful information may
              be hidden inside the evidence you already possess.
            </p>

            <div className="mt-5 border-l-2 border-amber-300/50 bg-amber-300/[0.04] px-4 py-3">
              <p className="text-xs uppercase tracking-[0.18em] text-amber-200/60">
                Investigator's note
              </p>

              <p className="mt-1 text-sm text-white/60">
                Inspect everything. The obvious information may not be the
                important information.
              </p>
            </div>
          </div>
        </section>

        <section className="mb-6">
          <div className="mb-3 flex items-end justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/30">
                Recovered Evidence
              </p>
              <h2 className="mt-1 text-lg font-bold">Evidence Board</h2>
            </div>

            <span className="text-xs text-white/30">
              {unlocked ? '3 / 3 unlocked' : '2 / 3 available'}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {evidence.map((item) => {
              const locked = item.locked && !unlocked;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => openEvidence(item.id)}
                  className={`min-h-[150px] border p-5 text-left transition ${
                    locked
                      ? 'cursor-pointer border-white/5 bg-[#0c0f11] opacity-60 hover:opacity-80'
                      : 'border-white/10 bg-[#101316] hover:border-amber-300/30 hover:bg-white/[0.03]'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div
                      className={`flex h-9 w-9 items-center justify-center border ${
                        locked
                          ? 'border-white/10 text-white/25'
                          : 'border-amber-300/20 text-amber-200/70'
                      }`}
                    >
                      {locked ? (
                        <LockKeyhole className="h-4 w-4" />
                      ) : (
                        <Archive className="h-4 w-4" />
                      )}
                    </div>

                    <span className="text-[9px] uppercase tracking-[0.18em] text-white/25">
                      {item.type}
                    </span>
                  </div>

                  <div className="mt-8 text-sm font-bold">{item.title}</div>

                  <div className="mt-1 text-[10px] text-white/30">
                    {locked ? 'LOCKED' : 'INSPECT EVIDENCE'}
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {message && (
          <div
            className={`mb-6 border px-4 py-3 text-sm ${
              message.startsWith('Correct')
                ? 'border-emerald-300/20 bg-emerald-300/[0.05] text-emerald-100'
                : message.startsWith('Incorrect')
                  ? 'border-red-300/20 bg-red-300/[0.05] text-red-100'
                  : 'border-amber-300/20 bg-amber-300/[0.05] text-amber-100'
            }`}
            role="status"
            aria-live="polite"
          >
            {message}
          </div>
        )}

        {selectedEvidence && (
          <section className="mb-6 border border-white/10 bg-[#0f1214]">
            <div className="flex items-start justify-between gap-4 border-b border-white/10 px-5 py-4">
              <div>
                <div className="text-[9px] uppercase tracking-[0.2em] text-white/30">
                  Evidence Viewer
                </div>

                <h2 className="mt-1 font-bold">{selectedEvidence.title}</h2>
              </div>

              <button
                type="button"
                onClick={() => setOpenedEvidence(null)}
                className="rounded p-2 text-white/35 hover:bg-white/5 hover:text-white"
                aria-label="Close evidence"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {selectedEvidence.id === 'receipt' && (
              <div className="grid gap-6 px-5 py-6 lg:grid-cols-[1fr_320px]">
                <div>
                  <div className="mx-auto max-w-md border border-white/10 bg-[#e7e0cf] p-6 font-mono text-[#24221d] shadow-2xl">
                    <div className="text-center text-xs font-bold tracking-[0.2em]">
                      MERCURY DRUG
                    </div>

                    <div className="mt-1 text-center text-[9px]">
                      AURORA BRANCH
                    </div>

                    <div className="my-5 border-y border-[#24221d]/20 py-3 text-[10px]">
                      <div>DATE: 17/08/26</div>
                      <div>TIME: 21:43</div>
                      <div>RECEIPT: #7741</div>
                    </div>

                    <div className="space-y-2 text-[10px]">
                      <div className="flex justify-between">
                        <span>PARACETAMOL</span>
                        <span>₱84.00</span>
                      </div>

                      <div className="flex justify-between">
                        <span>VITAMIN C</span>
                        <span>₱126.00</span>
                      </div>

                      <div className="flex justify-between">
                        <span>GAUZE</span>
                        <span>₱42.50</span>
                      </div>
                    </div>

                    <div className="mt-5 border-t border-[#24221d]/30 pt-3 text-right text-xs font-bold">
                      TOTAL: ₱252.50
                    </div>

                    <div className="mt-8 text-center text-[9px] text-[#24221d]/50">
                      Thank you.
                    </div>

                    {inspectionComplete && (
                      <button
                        type="button"
                        onClick={() => setCipherAnswer('7741')}
                        className="mt-5 w-full border-2 border-dashed border-red-700/50 bg-red-100/50 p-3 text-center text-xs font-bold text-red-800"
                      >
                        HANDWRITTEN MARKING:
                        <br />
                        <span className="text-base">7 7 4 1</span>
                      </button>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="border border-white/10 bg-black/20 p-4">
                    <div className="flex items-center gap-2 text-xs font-bold">
                      <Search className="h-4 w-4 text-amber-200" />
                      INSPECTION
                    </div>

                    <p className="mt-2 text-xs leading-6 text-white/45">
                      The receipt may contain information that is not visible
                      from a normal reading.
                    </p>

                    {!inspectionComplete ? (
                      <button
                        type="button"
                        onClick={inspectReceipt}
                        className="mt-4 flex min-h-11 w-full items-center justify-center gap-2 bg-amber-300 px-4 py-3 text-xs font-bold text-[#17130a] hover:bg-amber-200"
                      >
                        <Search className="h-4 w-4" />
                        INSPECT DEEPLY
                      </button>
                    ) : (
                      <div className="mt-4 flex items-center gap-2 text-xs text-emerald-200">
                        <Check className="h-4 w-4" />
                        Hidden marking discovered.
                      </div>
                    )}
                  </div>

                  <div className="border border-white/10 bg-black/20 p-4">
                    <div className="text-[9px] uppercase tracking-[0.18em] text-white/30">
                      Discovery
                    </div>

                    <p className="mt-2 text-sm font-semibold">
                      {inspectionComplete
                        ? 'A four-digit number has been found.'
                        : 'No secondary clue discovered yet.'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {selectedEvidence.id === 'photo' && (
              <div className="px-5 py-6">
                <div className="mx-auto max-w-xl border border-white/10 bg-[#171a1d] p-10">
                  <div className="flex min-h-[280px] items-center justify-center border border-dashed border-white/10">
                    <div className="text-center">
                      <Search className="mx-auto h-8 w-8 text-white/20" />
                      <p className="mt-3 text-xs uppercase tracking-[0.15em] text-white/30">
                        Photograph examination area
                      </p>
                      <p className="mt-2 text-xs text-white/20">
                        Future cases can place clickable hotspots directly
                        over photographs.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {selectedEvidence.id === 'sealed' && unlocked && (
              <div className="px-5 py-6">
                <div className="border border-emerald-300/20 bg-emerald-300/[0.04] p-6">
                  <div className="flex items-center gap-2 text-emerald-200">
                    <UnlockKeyhole className="h-5 w-5" />
                    <span className="text-sm font-bold">
                      EVIDENCE UNLOCKED
                    </span>
                  </div>

                  <div className="mt-5 border border-white/10 bg-black/20 p-5">
                    <div className="text-[9px] uppercase tracking-[0.2em] text-white/25">
                      FILE CONTENT
                    </div>

                    <p className="mt-3 text-sm leading-7 text-white/65">
                      The number found on the receipt was not a random
                      reference. It corresponds to a sealed investigation
                      record.
                    </p>

                    <p className="mt-4 font-mono text-sm text-amber-200">
                      FILE 7741 — ACCESS GRANTED
                    </p>
                  </div>
                </div>
              </div>
            )}
          </section>
        )}

        {cipherSolved && (
          <section className="mb-6 border border-emerald-300/20 bg-emerald-300/[0.03]">
            <div className="px-5 py-5">
              <div className="flex items-center gap-2 text-emerald-200">
                <UnlockKeyhole className="h-5 w-5" />
                <span className="text-sm font-bold">
                  NEW EVIDENCE DISCOVERED
                </span>
              </div>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/55">
                The sealed file is now available. In a real case, solving
                this puzzle would update the server-side session state and
                reveal the next stage of the investigation.
              </p>
            </div>
          </section>
        )}

        <section className="border border-white/10 bg-[#101316]">
          <div className="border-b border-white/10 px-5 py-4">
            <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/30">
              Puzzle Interface
            </div>

            <h2 className="mt-1 text-lg font-bold">
              The Sealed File
            </h2>
          </div>

          <div className="grid gap-6 px-5 py-6 lg:grid-cols-[1fr_320px]">
            <div>
              <div className="flex min-h-[210px] items-center justify-center border border-white/10 bg-black/20 p-6">
                <div className="text-center">
                  {unlocked ? (
                    <>
                      <UnlockKeyhole className="mx-auto h-10 w-10 text-emerald-200/70" />
                      <p className="mt-4 text-sm font-bold">
                        FILE UNLOCKED
                      </p>
                    </>
                  ) : (
                    <>
                      <LockKeyhole className="mx-auto h-10 w-10 text-amber-200/50" />
                      <p className="mt-4 text-sm font-bold">
                        FILE LOCKED
                      </p>
                      <p className="mt-2 text-xs text-white/30">
                        Enter the discovered four-digit code.
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="border border-white/10 bg-black/20 p-5">
              <label
                htmlFor="cipher"
                className="text-[9px] font-semibold uppercase tracking-[0.2em] text-white/35"
              >
                Access Code
              </label>

              <input
                id="cipher"
                value={cipherAnswer}
                onChange={(event) => setCipherAnswer(event.target.value)}
                disabled={unlocked}
                inputMode="numeric"
                maxLength={4}
                placeholder="____"
                className="mt-3 w-full border border-white/10 bg-[#0b0d0f] px-4 py-4 text-center font-mono text-2xl tracking-[0.4em] text-white outline-none placeholder:text-white/15 focus:border-amber-300/50"
              />

              <button
                type="button"
                onClick={solveCipher}
                disabled={unlocked || cipherAnswer.length !== 4}
                className="mt-3 flex min-h-11 w-full items-center justify-center gap-2 bg-amber-300 px-4 py-3 text-xs font-bold text-[#17130a] disabled:cursor-not-allowed disabled:opacity-30"
              >
                <UnlockKeyhole className="h-4 w-4" />
                {unlocked ? 'UNLOCKED' : 'SUBMIT CODE'}
              </button>

              <p className="mt-4 text-[10px] leading-5 text-white/25">
                Hint: investigate the available evidence before attempting
                the code.
              </p>
            </div>
          </div>
        </section>

        <div className="mt-6 flex flex-col gap-3 border-t border-white/10 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.15em] text-white/20">
            <FileText className="h-3.5 w-3.5" />
            Prototype investigation engine
          </div>

          <button
            type="button"
            onClick={resetPuzzle}
            className="flex min-h-11 items-center justify-center gap-2 border border-white/10 px-4 py-2 text-xs text-white/45 hover:bg-white/5 hover:text-white"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            RESET INVESTIGATION
          </button>
        </div>
      </main>
    </div>
  );
}
