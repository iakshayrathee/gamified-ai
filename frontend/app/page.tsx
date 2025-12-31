'use client';

import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { BookOpen, GraduationCap, Shield } from 'lucide-react';
import FloatingShapes from '@/components/ui/FloatingShapes';
import AnimatedButton from '@/components/ui/AnimatedButton';

export default function HomePage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-400 to-blue-400 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Animated Background Elements */}
      <FloatingShapes density="medium" theme="default" />

      {/* Gradient Overlay for depth */}
      <div className="absolute inset-0 bg-gradient-to-t from-transparent via-transparent to-white/10 pointer-events-none" />

      <div className="max-w-6xl w-full relative z-10">
        {/* Header */}
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 100, damping: 20 }}
          className="text-center mb-16"
        >
          <motion.h1
            className="text-7xl font-bold text-white mb-4 drop-shadow-lg"
            animate={{
              textShadow: [
                '0 0 20px rgba(255,255,255,0.5)',
                '0 0 40px rgba(255,255,255,0.8)',
                '0 0 20px rgba(255,255,255,0.5)',
              ]
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            📚 Literacy Learning Platform
          </motion.h1>
          <motion.p
            className="text-3xl text-white/90 font-semibold"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            Gamified Learning for Young Minds ✨
          </motion.p>
        </motion.div>

        {/* Role Selection Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Child Login */}
          <motion.div
            initial={{ scale: 0, opacity: 0, rotateY: -180 }}
            animate={{ scale: 1, opacity: 1, rotateY: 0 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            whileHover={{ scale: 1.05, y: -10, rotateZ: 2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => router.push('/login/child')}
            className="bg-white rounded-3xl p-8 shadow-2xl cursor-pointer hover:shadow-purple transition-all relative overflow-hidden group"
          >
            {/* Hover gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-400/20 to-pink-400/20 opacity-0 group-hover:opacity-100 transition-opacity" />

            <div className="text-center relative z-10">
              <motion.div
                className="bg-gradient-to-br from-purple-400 to-pink-400 rounded-full w-32 h-32 mx-auto mb-6 flex items-center justify-center shadow-lg"
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.6 }}
              >
                <BookOpen className="w-16 h-16 text-white" />
              </motion.div>
              <h2 className="text-4xl font-bold text-purple-800 mb-4">
                I'm a Child 👧🧒
              </h2>
              <p className="text-xl text-gray-600 mb-6">
                Play games and learn!
              </p>
              <AnimatedButton
                variant="primary"
                size="large"
                fullWidth
                withGlow
              >
                Login to Learn 🚀
              </AnimatedButton>
            </div>
          </motion.div>

          {/* Teacher Login */}
          <motion.div
            initial={{ scale: 0, opacity: 0, rotateY: -180 }}
            animate={{ scale: 1, opacity: 1, rotateY: 0 }}
            transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
            whileHover={{ scale: 1.05, y: -10, rotateZ: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => router.push('/login/teacher')}
            className="bg-white rounded-3xl p-8 shadow-2xl cursor-pointer hover:shadow-blue transition-all relative overflow-hidden group"
          >
            {/* Hover gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-400/20 to-cyan-400/20 opacity-0 group-hover:opacity-100 transition-opacity" />

            <div className="text-center relative z-10">
              <motion.div
                className="bg-gradient-to-br from-blue-400 to-cyan-400 rounded-full w-32 h-32 mx-auto mb-6 flex items-center justify-center shadow-lg"
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.6 }}
              >
                <GraduationCap className="w-16 h-16 text-white" />
              </motion.div>
              <h2 className="text-4xl font-bold text-blue-800 mb-4">
                I'm a Teacher 👨‍🏫
              </h2>
              <p className="text-xl text-gray-600 mb-6">
                Track student progress
              </p>
              <AnimatedButton
                variant="secondary"
                size="large"
                fullWidth
                withGlow
              >
                Login to Dashboard 📊
              </AnimatedButton>
            </div>
          </motion.div>

          {/* Admin Login */}
          <motion.div
            initial={{ scale: 0, opacity: 0, rotateY: -180 }}
            animate={{ scale: 1, opacity: 1, rotateY: 0 }}
            transition={{ delay: 0.4, type: 'spring', stiffness: 200 }}
            whileHover={{ scale: 1.05, y: -10, rotateZ: 2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => router.push('/login/admin')}
            className="bg-white rounded-3xl p-8 shadow-2xl cursor-pointer hover:shadow-pink transition-all relative overflow-hidden group"
          >
            {/* Hover gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-orange-400/20 to-red-400/20 opacity-0 group-hover:opacity-100 transition-opacity" />

            <div className="text-center relative z-10">
              <motion.div
                className="bg-gradient-to-br from-orange-400 to-red-400 rounded-full w-32 h-32 mx-auto mb-6 flex items-center justify-center shadow-lg"
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.6 }}
              >
                <Shield className="w-16 h-16 text-white" />
              </motion.div>
              <h2 className="text-4xl font-bold text-orange-800 mb-4">
                I'm an Admin 🔐
              </h2>
              <p className="text-xl text-gray-600 mb-6">
                Manage the platform
              </p>
              <AnimatedButton
                variant="warning"
                size="large"
                fullWidth
                withGlow
              >
                Login to Admin Panel ⚙️
              </AnimatedButton>
            </div>
          </motion.div>
        </div>

        {/* Footer */}
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5, type: 'spring' }}
          className="text-center mt-16"
        >
          <motion.p
            className="text-xl text-white font-semibold drop-shadow-lg"
            animate={{ scale: [1, 1.02, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            Powered by Adaptive AI • 100+ Skills • 10 Game Templates 🎮
          </motion.p>
        </motion.div>
      </div>
    </div>
  );
}

