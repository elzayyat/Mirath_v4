import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { User, Users, DollarSign, BookOpen, Shield, AlertTriangle, X } from 'lucide-react';
import { TreeNodeData } from './FamilyTree';

interface NodeDetailsModalProps {
  node: TreeNodeData | null;
  isOpen: boolean;
  onClose: () => void;
  language?: 'en' | 'ar';
}

const NodeDetailsModal: React.FC<NodeDetailsModalProps> = ({ node, isOpen, onClose, language = 'en' }) => {
  if (!node) return null;

  const sharePercent = node.attributes?.share ? parseFloat(node.attributes.share) * 100 : 0;
  const isRtl = language === 'ar';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`max-w-md ${isRtl ? 'text-right font-arabic' : ''}`}>
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <User className="w-5 h-5 text-gold" />
              {node.name}
            </span>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
              <X className="w-4 h-4" />
            </button>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Name in Arabic */}
          {node.nameAr && (
            <div className="text-center">
              <p className="text-2xl font-arabic text-gold">{node.nameAr}</p>
            </div>
          )}
          
          <Separator className="bg-gold/20" />
          
          {/* Type and Status */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Heir Type</p>
              <p className="font-medium">{node.type}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Status</p>
              {node.isBlocked ? (
                <Badge variant="destructive" className="mt-1">Blocked (محجوب)</Badge>
              ) : node.attributes?.isAsaba === 'true' ? (
                <Badge className="mt-1 bg-emerald-dark text-gold">Asaba (عصبة)</Badge>
              ) : (
                <Badge variant="secondary" className="mt-1">Regular Heir</Badge>
              )}
            </div>
          </div>
          
          {/* Share Information */}
          {!node.isBlocked && sharePercent > 0 && (
            <>
              <Separator className="bg-gold/20" />
              <div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <DollarSign className="w-3 h-3" />
                  Inheritance Share
                </p>
                <div className="mt-2 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Fraction:</span>
                    <span className="font-semibold font-arabic">{node.shareFraction || `${sharePercent / 100}`}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Percentage:</span>
                    <span className="font-semibold text-gold">{sharePercent.toFixed(2)}%</span>
                  </div>
                  {node.shareAmount && (
                    <div className="flex justify-between">
                      <span className="text-sm">Amount:</span>
                      <span className="font-semibold">${node.shareAmount.toFixed(2)}</span>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
          
          {/* Blocked Reason */}
          {node.isBlocked && node.blockedReason && (
            <>
              <Separator className="bg-gold/20" />
              <div className="bg-red-50 p-3 rounded-lg">
                <p className="text-xs text-red-600 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  Blocked Reason
                </p>
                <p className="text-sm mt-1">{node.blockedReason}</p>
              </div>
            </>
          )}
          
          {/* Islamic Reference */}
          <Separator className="bg-gold/20" />
          <div className="bg-emerald-dark/5 p-3 rounded-lg">
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <BookOpen className="w-3 h-3" />
              Islamic Reference
            </p>
            <p className="text-sm mt-1 font-arabic text-right">
              {getIslamicReference(node.type, language)}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

function getIslamicReference(heirType: string, language: string): string {
  const references: Record<string, string> = {
    'Husband': 'وَلَكُمْ نِصْفُ مَا تَرَكَ أَزْوَاجُكُمْ إِن لَّمْ يَكُن لَّهُنَّ وَلَدٌ (النساء: 12)',
    'Wife': 'وَلَهُنَّ الرُّبُعُ مِمَّا تَرَكْتُمْ إِن لَّمْ يَكُن لَّكُمْ وَلَدٌ (النساء: 12)',
    'Father': 'وَلِأَبَوَيْهِ لِكُلِّ وَاحِدٍ مِّنْهُمَا السُّدُسُ مِمَّا تَرَكَ إِن كَانَ لَهُ وَلَدٌ (النساء: 11)',
    'Mother': 'وَلِأَبَوَيْهِ لِكُلِّ وَاحِدٍ مِّنْهُمَا السُّدُسُ مِمَّا تَرَكَ إِن كَانَ لَهُ وَلَدٌ (النساء: 11)',
    'Daughter': 'يُوصِيكُمُ اللَّهُ فِي أَوْلَادِكُمْ ۖ لِلذَّكَرِ مِثْلُ حَظِّ الْأُنثَيَيْنِ (النساء: 11)',
    'Son': 'يُوصِيكُمُ اللَّهُ فِي أَوْلَادِكُمْ ۖ لِلذَّكَرِ مِثْلُ حَظِّ الْأُنثَيَيْنِ (النساء: 11)',
    'Sister': 'يَسْتَفْتُونَكَ قُلِ اللَّهُ يُفْتِيكُمْ فِي الْكَلَالَةِ (النساء: 176)',
  };
  
  const defaultRef = 'مستند إلى الكتاب والسنة - Based on Quran and Sunnah';
  
  if (language === 'ar') {
    return references[heirType] || defaultRef;
  }
  
  const englishRefs: Record<string, string> = {
    'Husband': 'And for you is half of what your wives leave if they have no child (Quran 4:12)',
    'Wife': 'And for them is one-fourth of what you leave if you have no child (Quran 4:12)',
    'Father': 'For parents, each gets one-sixth if the deceased has children (Quran 4:11)',
    'Mother': 'For parents, each gets one-sixth if the deceased has children (Quran 4:11)',
    'Daughter': 'Allah instructs you concerning your children: for the male, like the share of two females (Quran 4:11)',
    'Son': 'Allah instructs you concerning your children: for the male, like the share of two females (Quran 4:11)',
  };
  
  return englishRefs[heirType] || defaultRef;
}

export default NodeDetailsModal;