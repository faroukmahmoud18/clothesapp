import React, { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';

interface SignaturePadProps {
  onSave: (signature: string) => void;
}

const SignaturePad: React.FC<SignaturePadProps> = ({ onSave }) => {
  const { t } = useTranslation();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleSave = () => {
    if (canvasRef.current) {
      const signature = canvasRef.current.toDataURL();
      onSave(signature);
    }
  };

  const handleClear = () => {
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
    }
  };

  return (
    <div>
      <canvas
        ref={canvasRef}
        width={400}
        height={200}
        className="border border-gray-400"
      ></canvas>
      <div className="mt-2">
        <Button onClick={handleSave}>{t('saveSignature')}</Button>
        <Button variant="outline" onClick={handleClear} className="ml-2">
          {t('clearSignature')}
        </Button>
      </div>
    </div>
  );
};

export default SignaturePad;
