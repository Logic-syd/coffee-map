// 统一动效配置，供 framer-motion 组件引用
export const tapSpring = {
  scale: 0.95,
  transition: { type: "spring", stiffness: 300, damping: 20 },
};

export const hoverSpring = {
  scale: 1.02,
  transition: { type: "spring", stiffness: 300, damping: 20 },
};

export const popupMotion = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 20 },
  transition: { type: "spring", stiffness: 300, damping: 24 },
};

export const pulse = {
  scale: [1, 1.2, 0.95, 1],
  transition: { duration: 0.4, type: "spring", stiffness: 400, damping: 10 },
};
