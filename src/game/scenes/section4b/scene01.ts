import type {
  PhotoVersion,
  PlayerPerspective,
  SceneState,
} from '../../types';

export type PhotoPerspective = {
  version: PhotoVersion;
  visibleDetail: string;
  backText: string;
};

export function getPhotoPerspective(
  perspective: PlayerPerspective,
  scene: SceneState,
): PhotoPerspective {
  if (scene.photographInspected) {
    if (perspective === 'A') {
      return {
        version: 'thirty-students',
        visibleDetail: 'There are 30 visible students.',
        backText: 'SECTION 4-B — 31 STUDENTS',
      };
    }

    if (perspective === 'B') {
      return {
        version: 'thirty-one-students',
        visibleDetail: 'You can count 31 students.',
        backText: 'SECTION 4-B — 31 STUDENTS',
      };
    }

    return {
      version: 'empty-chair',
      visibleDetail: 'There are 30 students and one empty chair.',
      backText: 'SECTION 4-B — 31 STUDENTS',
    };
  }

  return {
    version:
      perspective === 'B'
        ? 'thirty-one-students'
        : 'thirty-students',
    visibleDetail:
      perspective === 'B'
        ? 'Something about the photograph feels wrong.'
        : 'An old Section 4-B class photograph.',
    backText: 'Turn the photograph over to inspect it.',
  };
}
