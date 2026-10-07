import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent,
} from 'react';
import type {PhotoVersion, PlayerPerspective} from './game/types';
import {getPhotoPerspective} from './game/scenes/section4b/scene01';
import {createInitialGameState} from './game/state';

const INITIAL_STATE = createInitialGameState();

const STUDENT_NAMES = [
  'Mika Reyes',
  'Carlo Mendoza',
  'Adrian Cruz',
  'Vince Santos',
  'Paolo Ramos',
  'Jessa Flores',
  'Nicole Garcia',
  'Trina Bautista',
  'Marco Dela Cruz',
  'Anne Villanueva',
  'Kevin Torres',
  'Bea Navarro',
  'Luis Aquino',
  'Rina Castillo',
  'Daniel Lim',
  'Kate Manalo',
  'Joshua Reyes',
  'Mara Santiago',
  'Ian Mercado',
  'Ella Ramos',
  'Noel Garcia',
  'Patricia Cruz',
  'Ralph Santos',
  'Mia Torres',
  'Carlo Flores',
  'Janine Lim',
  'Eric Navarro',
  'Faith Aquino',
  'Gabriel Tan',
  'Lara Mendoza',
  'Unknown',
];

const PERSPECTIVE_LABELS: Record<PlayerPerspective, string> = {
  A: 'PLAYER A',
  B: 'PLAYER B',
  C: 'PLAYER C',
};

function StudentPortrait({
  index,
  name,
  highlighted,
}: {
  index: number;
  name: string;
  highlighted: boolean;
}) {
  const shirt = [
    'bg-[#343b3d]',
    'bg-[#4b4640]',
    'bg-[#26363a]',
    'bg-[#51483d]',
  ][index % 4];

  const hair = [
    'bg-[#191716]',
    'bg-[#27221e]',
    'bg-[#332923]',
  ][index % 3];

  return (
    <div
      className={`relative flex aspect-[0.68] min-w-0 flex-col items-center justify-end overflow-hidden border ${
        highlighted
          ? 'border-[#c9b989]/80 shadow-[0_0_14px_rgba(201,185,137,0.25)]'
          : 'border-black/30'
      } ${shirt}`}
      title={name}
    >
      <div
        className={`absolute top-[12%] h-[38%] w-[46%] rounded-[45%_45%_42%_42%] ${hair}`}
      />

      <div className="absolute top-[18%] h-[28%] w-[34%] rounded-[48%] bg-[#8f7660]">
        <div className="absolute left-[23%] top-[45%] h-[3px] w-[3px] rounded-full bg-black/70" />
        <div className="absolute right-[23%] top-[45%] h-[3px] w-[3px] rounded-full bg-black/70" />
        <div className="absolute left-1/2 top-[66%] h-px w-[18%] -translate-x-1/2 bg-black/50" />
      </div>

      <div className="h-[39%] w-[66%] rounded-t-[48%] bg-black/25" />

      <span className="absolute bottom-0.5 left-1/2 w-full -translate-x-1/2 truncate px-0.5 text-center font-mono text-[3px] tracking-[0.02em] text-white/35">
        {name}
      </span>
    </div>
  );
}

function Photograph({
  version,
  turned,
  rotation,
  zoom,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onDoubleClick,
}: {
  version: PhotoVersion;
  turned: boolean;
  rotation: number;
  zoom: number;
  onPointerDown: (event: PointerEvent<HTMLDivElement>) => void;
  onPointerMove: (event: PointerEvent<HTMLDivElement>) => void;
  onPointerUp: () => void;
  onDoubleClick: () => void;
}) {
  const count = version === 'thirty-one-students' ? 31 : 30;

  const missingIndex =
    version === 'empty-chair' ? 0 : version === 'thirty-students' ? 30 : -1;

  return (
    <div
      className="absolute left-1/2 top-1/2 z-20 w-[min(520px,72vw)] max-w-[520px] -translate-x-1/2 -translate-y-1/2 cursor-grab select-none touch-none active:cursor-grabbing"
      style={{
        transform: `translate(-50%, -50%) rotate(${rotation}deg) scale(${zoom})`,
        transformOrigin: 'center center',
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onDoubleClick={onDoubleClick}
    >
      <div className="relative aspect-[1.42] rotate-[-1deg] bg-[#b7a987] p-[3.5%] shadow-[0_28px_70px_rgba(0,0,0,0.75)]">
        <div className="absolute inset-[1.4%] border border-black/20" />

        {!turned ? (
          <div className="relative h-full overflow-hidden bg-[#726a5b]">
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.1),transparent_30%,rgba(0,0,0,0.35)),radial-gradient(circle_at_50%_38%,#968a75,#635e51_75%)]" />

            <div className="absolute left-[4%] top-[4%] text-[6px] font-semibold tracking-[0.25em] text-black/55">
              SECTION 4-B
            </div>

            <div className="absolute left-[4%] right-[4%] top-[16%] grid grid-cols-10 gap-[1.2%]">
              {Array.from({length: count}).map((_, index) => (
                <StudentPortrait
                  key={index}
                  index={index}
                  name={STUDENT_NAMES[index]}
                  highlighted={index === missingIndex}
                />
              ))}
            </div>

            {version === 'empty-chair' && (
              <div className="absolute bottom-[11%] left-[5%] h-[14%] w-[8%]">
                <div className="absolute bottom-0 left-1/2 h-[75%] w-[42%] -translate-x-1/2 border-x-2 border-t-2 border-black/45" />
                <div className="absolute bottom-0 left-[18%] h-[45%] w-1 bg-black/45" />
                <div className="absolute bottom-0 right-[18%] h-[45%] w-1 bg-black/45" />
              </div>
            )}

            {version === 'thirty-one-students' && (
              <div className="absolute right-[7%] bottom-[7%] rotate-[-5deg] font-serif text-[7px] text-black/55">
                M.
              </div>
            )}

            <div className="absolute bottom-[3%] left-1/2 -translate-x-1/2 whitespace-nowrap font-mono text-[5px] tracking-[0.28em] text-black/55">
              SAN ISIDRO NATIONAL HIGH SCHOOL • 2014
            </div>

            <div className="pointer-events-none absolute inset-0 opacity-20 [background-image:radial-gradient(rgba(255,255,255,.35)_0.5px,transparent_0.5px)] [background-size:3px_3px]" />
          </div>
        ) : (
          <div className="relative flex h-full flex-col justify-between overflow-hidden bg-[#b7aa8d] p-[7%] font-serif text-[#302c24]">
            <div className="text-[8px] tracking-[0.18em]">
              SECTION 4-B — 31 STUDENTS
            </div>

            <div className="space-y-2 text-[10px] leading-relaxed">
              <div>San Isidro National High School</div>
              <div>Senior High — Class Photograph</div>
              <div className="mt-5 border-t border-black/20 pt-3">
                The ink has bled into the paper.
              </div>
            </div>

            <div className="font-mono text-[8px] tracking-[0.2em]">
              DO NOT FORGET.
            </div>

            <div className="absolute bottom-[19%] right-[12%] rotate-[-8deg] text-[9px] text-red-900/70">
              4-B
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function App() {
  const [perspective, setPerspective] =
    useState<PlayerPerspective>('A');

  const [photoVersion, setPhotoVersion] =
    useState<PhotoVersion>('thirty-students');

  const [turned, setTurned] = useState(false);
  const [rotation, setRotation] = useState(-7);
  const [zoom, setZoom] = useState(1);
  const [startedAt] = useState(Date.now());

  const [elapsed, setElapsed] = useState(0);

  const drag = useRef<{
    active: boolean;
    startX: number;
    startY: number;
    startRotation: number;
  }>({
    active: false,
    startX: 0,
    startY: 0,
    startRotation: -7,
  });

  useEffect(() => {
    const timer = window.setInterval(() => {
      setElapsed(Math.floor((Date.now() - startedAt) / 1000));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [startedAt]);

  const minutes = String(Math.floor(elapsed / 60)).padStart(2, '0');
  const seconds = String(elapsed % 60).padStart(2, '0');

  const scene = useMemo(
    () => ({
      ...INITIAL_STATE.scene,
      photographInspected: true,
      photoTurned: turned,
      photoVersion,
    }),
    [turned, photoVersion],
  );

  const photo = getPhotoPerspective(perspective, scene);

  function handlePhotoPointerDown(
    event: PointerEvent<HTMLDivElement>,
  ) {
    event.currentTarget.setPointerCapture(event.pointerId);

    drag.current = {
      active: true,
      startX: event.clientX,
      startY: event.clientY,
      startRotation: rotation,
    };
  }

  function handlePhotoPointerMove(
    event: PointerEvent<HTMLDivElement>,
  ) {
    if (!drag.current.active) return;

    const dx = event.clientX - drag.current.startX;
    const dy = event.clientY - drag.current.startY;

    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > 12) {
      setRotation(
        drag.current.startRotation +
          dx * 0.45 -
          dy * 0.12,
      );
    }
  }

  function handlePhotoPointerUp() {
    if (!drag.current.active) return;

    drag.current.active = false;

    const normalized = ((rotation % 360) + 360) % 360;

    if (
      normalized > 135 &&
      normalized < 225
    ) {
      setTurned(true);
      setRotation(180);
    } else if (
      normalized < 45 ||
      normalized > 315
    ) {
      setTurned(false);
      setRotation(0);
    }
  }

  function changePerspective(value: PlayerPerspective) {
    setPerspective(value);
    setTurned(false);
    setRotation(-7);
    setZoom(1);

    if (value === 'A') {
      setPhotoVersion('thirty-students');
    } else if (value === 'B') {
      setPhotoVersion('thirty-one-students');
    } else {
      setPhotoVersion('empty-chair');
    }
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#08090a] text-[#ddd5c4]">
      <div className="relative min-h-screen">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_18%,rgba(120,128,112,0.13),transparent_38%),linear-gradient(180deg,#171918,#0a0b0b_60%,#050606)]" />

        <div className="pointer-events-none absolute inset-0 opacity-25">
          <div className="absolute left-[8%] top-0 h-full w-px bg-white/10" />
          <div className="absolute left-[31%] top-0 h-full w-px bg-white/5" />
          <div className="absolute right-[26%] top-0 h-full w-px bg-white/5" />
          <div className="absolute right-[8%] top-0 h-full w-px bg-white/10" />
        </div>

        <header className="relative z-30 flex items-center justify-between border-b border-white/10 px-5 py-4 md:px-8">
          <div>
            <div className="text-[9px] tracking-[0.35em] text-white/30">
              SMAK ESCAPE ROOM
            </div>
            <div className="mt-1 text-sm tracking-[0.18em] text-white/70">
              CASE 001 — SECTION 4-B
            </div>
          </div>

          <div className="font-mono text-xs tracking-[0.16em] text-white/45">
            {minutes}:{seconds}
          </div>
        </header>

        <section className="relative min-h-[calc(100vh-69px)] overflow-hidden">
          <div className="absolute left-1/2 top-[8%] h-2 w-[52%] -translate-x-1/2 rounded-full bg-white/30 blur-md" />

          <div className="absolute inset-0 bg-[#393b36]" />

          <div className="absolute inset-x-0 top-0 h-[18%] bg-[#252824]">
            <div className="absolute inset-x-0 bottom-0 h-1 bg-black/40" />
            <div className="absolute left-[8%] top-[36%] h-2 w-[20%] rounded-full bg-white/25 blur-md" />
            <div className="absolute left-[10%] top-[34%] h-1 w-[17%] rounded-full bg-white/35" />
            <div className="absolute right-[12%] top-[36%] h-2 w-[20%] rounded-full bg-white/20 blur-md" />
            <div className="absolute right-[14%] top-[34%] h-1 w-[17%] rounded-full bg-white/30" />
          </div>

          <div className="absolute left-[6%] top-[19%] h-[42%] w-[25%] border-4 border-[#242825] bg-[#101615] shadow-[inset_0_0_25px_rgba(0,0,0,0.8)]">
            <div className="absolute inset-2 bg-[#253536]">
              <div className="absolute inset-x-0 top-1/2 h-px bg-white/10" />
              <div className="absolute inset-y-0 left-1/2 w-px bg-white/10" />

              <div className="absolute inset-0 overflow-hidden opacity-45">
                <div className="absolute -left-2 top-0 h-[130%] w-px rotate-[13deg] bg-white/20" />
                <div className="absolute left-[18%] top-0 h-[130%] w-px rotate-[13deg] bg-white/15" />
                <div className="absolute left-[43%] top-0 h-[130%] w-px rotate-[13deg] bg-white/20" />
                <div className="absolute left-[70%] top-0 h-[130%] w-px rotate-[13deg] bg-white/15" />
                <div className="absolute left-[94%] top-0 h-[130%] w-px rotate-[13deg] bg-white/20" />
              </div>
            </div>
          </div>

          <div className="absolute right-[8%] top-[20%] h-[39%] w-[21%] border-4 border-[#282b27] bg-[#151918] shadow-[inset_0_0_30px_rgba(0,0,0,0.8)]">
            <div className="absolute inset-2 bg-[#303d3b]">
              <div className="absolute inset-x-0 top-1/2 h-1 bg-[#1c2524]" />
              <div className="absolute inset-y-0 left-1/2 w-1 bg-[#1c2524]" />

              <div className="absolute inset-0 overflow-hidden">
                <div className="absolute left-[8%] top-0 h-[140%] w-px rotate-[14deg] bg-white/10" />
                <div className="absolute left-[25%] top-0 h-[140%] w-px rotate-[14deg] bg-white/15" />
                <div className="absolute left-[48%] top-0 h-[140%] w-px rotate-[14deg] bg-white/10" />
                <div className="absolute left-[74%] top-0 h-[140%] w-px rotate-[14deg] bg-white/15" />
                <div className="absolute left-[94%] top-0 h-[140%] w-px rotate-[14deg] bg-white/10" />
              </div>
            </div>
          </div>

          <div className="absolute left-[39%] top-[22%] h-[29%] w-[23%] border-2 border-black/40 bg-[#30342f] shadow-[inset_0_0_35px_rgba(0,0,0,0.5)]">
            <div className="absolute left-[7%] top-[9%] h-px w-[62%] rotate-[-3deg] bg-white/15" />
            <div className="absolute left-[9%] top-[22%] h-px w-[46%] rotate-[2deg] bg-white/10" />
            <div className="absolute right-[9%] top-[41%] h-px w-[33%] rotate-[-2deg] bg-white/10" />
          </div>

          <div className="absolute bottom-[9%] left-[5%] h-[15%] w-[20%] rotate-[-2deg] border border-black/70 bg-[#302d27] shadow-2xl">
            <div className="absolute left-[12%] top-[18%] h-2 w-[70%] bg-black/25" />
            <div className="absolute left-[19%] top-[42%] h-2 w-[58%] bg-black/20" />
            <div className="absolute bottom-0 left-[17%] h-[42%] w-3 bg-[#211f1a]" />
            <div className="absolute bottom-0 right-[17%] h-[42%] w-3 bg-[#211f1a]" />
          </div>

          <div className="absolute bottom-[10%] right-[7%] h-[18%] w-[10%] border border-black/70 bg-[#272620] shadow-2xl">
            <div className="absolute -left-1 top-[18%] h-2 w-4 rounded-sm bg-[#4a463b]" />
            <div className="absolute -left-1 top-[45%] h-2 w-4 rounded-sm bg-[#4a463b]" />
            <div className="absolute -left-1 top-[72%] h-2 w-4 rounded-sm bg-[#4a463b]" />
          </div>

          <div className="absolute bottom-0 left-0 right-0 h-[27%] bg-[#25231f]">
            <div className="absolute inset-0 opacity-40 [background-image:linear-gradient(90deg,rgba(255,255,255,.025)_1px,transparent_1px)] [background-size:48px_100%]" />
            <div className="absolute inset-x-0 top-0 h-2 bg-[#191917]" />
          </div>

          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_25%,rgba(0,0,0,0.58)_100%)]" />


          <div className="pointer-events-none absolute left-[7%] top-[20%] h-[39%] w-[23%] overflow-hidden opacity-35">
            <div className="absolute inset-0 [background-image:repeating-linear-gradient(104deg,transparent_0px,transparent_18px,rgba(210,220,218,.28)_19px,transparent_20px)] [background-size:70px_90px] animate-[rain_0.8s_linear_infinite]" />
          </div>

          <div className="pointer-events-none absolute right-[9%] top-[21%] h-[37%] w-[19%] overflow-hidden opacity-30">
            <div className="absolute inset-0 [background-image:repeating-linear-gradient(104deg,transparent_0px,transparent_16px,rgba(210,220,218,.25)_17px,transparent_18px)] [background-size:62px_82px] animate-[rain_0.7s_linear_infinite]" />
          </div>

          <Photograph
            version={photo.version}
            turned={turned}
            rotation={rotation}
            zoom={zoom}
            onPointerDown={handlePhotoPointerDown}
            onPointerMove={handlePhotoPointerMove}
            onPointerUp={handlePhotoPointerUp}
            onDoubleClick={() => setZoom((value) => Math.min(1.7, value + 0.15))}
          />

          <div className="absolute bottom-5 right-5 z-30 text-right md:right-8">
            <div className="text-[8px] tracking-[0.28em] text-white/20">
              {PERSPECTIVE_LABELS[perspective]}
            </div>
          </div>

          <div className="absolute left-5 top-5 z-40 flex gap-1 opacity-30 transition-opacity hover:opacity-100">
            {(['A', 'B', 'C'] as PlayerPerspective[]).map(
              (value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => changePerspective(value)}
                  className={`border px-2 py-1 text-[7px] tracking-[0.15em] ${
                    perspective === value
                      ? 'border-white/40 text-white'
                      : 'border-white/10 text-white/40'
                  }`}
                >
                  DEV {value}
                </button>
              ),
            )}

            <button
              type="button"
              onClick={() =>
                setZoom((value) =>
                  Math.min(1.7, Number((value + 0.1).toFixed(1))),
                )
              }
              className="border border-white/10 px-2 py-1 text-[7px] text-white/40"
            >
              +
            </button>

            <button
              type="button"
              onClick={() =>
                setZoom((value) =>
                  Math.max(0.8, Number((value - 0.1).toFixed(1))),
                )
              }
              className="border border-white/10 px-2 py-1 text-[7px] text-white/40"
            >
              −
            </button>
          </div>
        </section>
      </div>

      <style>{`
        @keyframes rain {
          from { transform: translateY(-90px); }
          to { transform: translateY(90px); }
        }
      `}</style>
    </main>
  );
}
