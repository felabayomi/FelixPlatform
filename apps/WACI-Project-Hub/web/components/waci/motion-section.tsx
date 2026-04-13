"use client";

import { motion } from "framer-motion";

export function MotionSection({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            viewport={{ once: true }}
        >
            {children}
        </motion.div>
    );
}
