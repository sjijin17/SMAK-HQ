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
  onTurnedChange,
}: {
  version: PhotoVersion;
  turned: boolean;
  onTurnedChange: (turned: boolean) => void;
}) {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [rotation, setRotation] = useState(0);
  const [zoom, setZoom] = useState(1);

  const drag = useRef<{
    active: boolean;
    pointerId: number | null;
    startPointerX: number;
    startPointerY: number;
    startX: number;
    startY: number;
    startRotation: number;
  }>({
    active: false,
    pointerId: null,
    startPointerX: 0,
    startPointerY: 0,
    startX: 0,
    startY: 0,
    startRotation: 0,
  });

  const rotationRef = useRef(0);
  const positionRef = useRef({ x: 0, y: 0 });

  const setPhotoRotation = (value: number) => {
    rotationRef.current = value;
    setRotation(value);
  };

  const setPhotoPosition = (value: { x: number; y: number }) => {
    positionRef.current = value;
    setPosition(value);
  };

  const normalizeRotation = (value: number) => {
    let result = value % 360;
    if (result < 0) result += 360;
    return result;
  };

  const handlePointerDown = (
    event: React.PointerEvent<HTMLDivElement>,
  ) => {
    if (event.button !== 0) return;

    event.preventDefault();

    event.currentTarget.setPointerCapture(event.pointerId);

    drag.current = {
      active: true,
      pointerId: event.pointerId,
      startPointerX: event.clientX,
      startPointerY: event.clientY,
      startX: positionRef.current.x,
      startY: positionRef.current.y,
      startRotation: rotationRef.current,
    };
  };

  const handlePointerMove = (
    event: React.PointerEvent<HTMLDivElement>,
  ) => {
    if (
      !drag.current.active ||
      drag.current.pointerId !== event.pointerId
    ) {
      return;
    }

    event.preventDefault();

    const dx = event.clientX - drag.current.startPointerX;
    const dy = event.clientY - drag.current.startPointerY;

    /*
     * The photograph physically follows the pointer.
     * It is no longer locked to one side of the investigation area.
     */
    setPhotoPosition({
      x: drag.current.startX + dx,
      y: drag.current.startY + dy,
    });

    /*
     * Horizontal movement produces physical rotation.
     * This is deliberately slower than the old system so
     * the player can control the photograph easily.
     */
    const nextRotation =
      drag.current.startRotation + dx * 0.22;

    setPhotoRotation(nextRotation);
  };

  const finishDrag = (
    event: React.PointerEvent<HTMLDivElement>,
  ) => {
    if (
      !drag.current.active ||
      drag.current.pointerId !== event.pointerId
    ) {
      return;
    }

    drag.current.active = false;
    drag.current.pointerId = null;

    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch {
      // Pointer capture may already have been released.
    }

    const currentRotation = normalizeRotation(
      rotationRef.current,
    );

    /*
     * Easier physical flip:
     *
     * 135°–225° = back
     * otherwise = front
     *
     * The photo snaps naturally to whichever side
     * the player was trying to reach.
     */
    if (
      currentRotation >= 120 &&
      currentRotation <= 240
    ) {
      onTurnedChange(true);
      setPhotoRotation(180);
    } else {
      onTurnedChange(false);
      setPhotoRotation(0);
    }
  };

  const handleWheel = (
    event: React.WheelEvent<HTMLDivElement>,
  ) => {
    event.preventDefault();

    setZoom((current) =>
      Math.max(
        0.65,
        Math.min(
          2.4,
          Number(
            (current - event.deltaY * 0.001).toFixed(2),
          ),
        ),
      ),
    );
  };

  /*
   * Double click is only a natural zoom gesture.
   * It does not reveal clues or give instructions.
   */
  const handleDoubleClick = () => {
    setZoom((current) =>
      current >= 1.7
        ? 1
        : Math.min(1.7, Number((current + 0.2).toFixed(1))),
    );
  };

  /*
   * These are the eventual real photographic assets.
   *
   * All three perspectives intentionally point to the same
   * physical photograph for now. Perspective-specific image
   * variants can be introduced later without changing the
   * interaction system.
   */
  const photoSources: Record<PhotoVersion, string> = {
    "thirty-students":
      "/assets/section4b/class-photo-base.jpg",
    "thirty-one-students":
      "/assets/section4b/class-photo-base.jpg",
    "empty-chair":
      "/assets/section4b/class-photo-base.jpg",
  };

  const photoSource = photoSources[version];

  return (
    <div
      className="absolute left-1/2 top-1/2 z-30"
      style={{
        transform: `translate(calc(-50% + ${position.x}px), calc(-50% + ${position.y}px))`,
      }}
    >
      <div
        className="relative"
        style={{
          transform: `rotate(${rotation}deg) scale(${zoom})`,
          transformOrigin: "center center",
          transition: drag.current.active
            ? "none"
            : "transform 180ms ease-out",
          touchAction: "none",
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={finishDrag}
        onPointerCancel={finishDrag}
        onWheel={handleWheel}
        onDoubleClick={handleDoubleClick}
      >
        <div
          className="relative cursor-grab select-none active:cursor-grabbing"
          style={{
            width: "min(760px, 76vw)",
            maxWidth: "760px",
            minWidth: "420px",
            aspectRatio: "4 / 3",
          }}
        >
          {!turned ? (
            <div className="relative h-full w-full overflow-hidden rounded-[2px] bg-[#ddd0b7] p-[3%] shadow-[0_30px_80px_rgba(0,0,0,0.65)]">
              <div className="relative h-full w-full overflow-hidden bg-black/20">
                <img
                  src={photoSource}
                  alt="Section 4-B class photograph"
                  draggable={false}
                  className="h-full w-full object-cover"
                  onError={(event) => {
                    /*
                     * Until the realistic class-photo asset is
                     * generated, keep the physical photograph
                     * surface intact rather than showing a broken
                     * browser image.
                     */
                    event.currentTarget.style.display = "none";
                  }}
                />

                <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/12 via-transparent to-black/20" />
                <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-black/25" />

                <div className="pointer-events-none absolute inset-0 opacity-[0.08] [background-image:radial-gradient(rgba(255,255,255,.8)_0.6px,transparent_0.6px)] [background-size:4px_4px]" />
              </div>

              <div className="pointer-events-none absolute inset-[1.4%] border border-black/20" />
            </div>
          ) : (
            <div className="relative h-full w-full overflow-hidden rounded-[2px] bg-[#d5c5a5] p-[7%] text-[#342d24] shadow-[0_30px_80px_rgba(0,0,0,0.65)]">
              <div className="absolute inset-[3%] border border-[#514839]/30" />

              <div className="relative flex h-full flex-col justify-between font-serif">
                <div className="text-[clamp(9px,1vw,13px)] tracking-[0.18em]">
                  SECTION 4-B — 31 STUDENTS
                </div>

                <div className="space-y-3 text-[clamp(10px,1.1vw,14px)] leading-relaxed">
                  <div>
                    San Isidro National High School
                  </div>

                  <div>
                    Senior High — Class Photograph
                  </div>

                  <div className="mt-8 border-t border-black/20 pt-4">
                    The ink has bled into the paper.
                  </div>
                </div>

                <div className="font-mono text-[clamp(8px,0.8vw,11px)] tracking-[0.2em]">
                  DO NOT FORGET.
                </div>

                <div className="absolute bottom-[17%] right-[10%] rotate-[-8deg] text-[clamp(9px,0.9vw,12px)] text-red-900/65">
                  4-B
                </div>
              </div>
            </div>
          )}
        </div>
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
  const [startedAt] = useState(Date.now());

  const [elapsed, setElapsed] = useState(0);


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



  function changePerspective(value: PlayerPerspective) {
    setPerspective(value);
    setTurned(false);

    if (value === "A") {
      setPhotoVersion("thirty-students");
    } else if (value === "B") {
      setPhotoVersion("thirty-one-students");
    } else {
      setPhotoVersion("empty-chair");
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
            onTurnedChange={setTurned}
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
