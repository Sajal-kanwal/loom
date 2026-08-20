import { animate, stagger } from 'animejs'

/**
 * Animate elements entering with a staggered fade and slide up
 */
export function animateStaggerEntrance(
  selectorOrElements: string | HTMLElement[] | NodeListOf<HTMLElement>,
  options?: { delay?: number; duration?: number },
) {
  if (!selectorOrElements) return
  return animate(selectorOrElements, {
    opacity: [0, 1],
    translateY: [16, 0],
    scale: [0.98, 1],
    delay: stagger(options?.delay ?? 60, { start: 50 }),
    duration: options?.duration ?? 450,
    ease: 'outCubic',
  })
}

/**
 * Animate message bubble entry
 */
export function animateMessageEntry(element: HTMLElement | null) {
  if (!element) return
  return animate(element, {
    opacity: [0, 1],
    translateY: [12, 0],
    duration: 350,
    ease: 'outQuad',
  })
}

/**
 * Animate subtle button click pulse
 */
export function animateButtonPulse(element: HTMLElement | null) {
  if (!element) return
  return animate(element, {
    scale: [1, 0.96, 1],
    duration: 200,
    ease: 'inOutQuad',
  })
}
