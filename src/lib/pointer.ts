/**
 * One shared pointer store. The WebGL engine reads normalized values;
 * the custom cursor reads pixel values. No per-component listeners.
 */
export interface PointerState {
  x: number;
  y: number;
  nx: number;
  ny: number;
}

export const pointer: PointerState = {
  x: window.innerWidth / 2,
  y: window.innerHeight / 2,
  nx: 0,
  ny: 0,
};

window.addEventListener('mousemove', (event: MouseEvent) => {
  pointer.x = event.clientX;
  pointer.y = event.clientY;
  pointer.nx = (event.clientX / window.innerWidth) * 2 - 1;
  pointer.ny = (event.clientY / window.innerHeight) * 2 - 1;
}, { passive: true });
