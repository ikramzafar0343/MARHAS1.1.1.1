import React from 'react';
import { motion } from 'framer-motion';
import BrandWordmark from '../ui/BrandWordmark';

const Loader = () => {
  return (
    <div className="fixed inset-0 bg-brand-bg z-[100] flex flex-col items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1, repeat: Infinity, repeatType: "reverse" }}
      >
        <BrandWordmark context="loader" />
      </motion.div>
      <motion.div 
        className="w-24 h-[1px] bg-brand-accent mt-8"
        initial={{ width: 0 }}
        animate={{ width: 96 }}
        transition={{ duration: 1.5, repeat: Infinity }}
      />
    </div>
  );
};

export default Loader;
