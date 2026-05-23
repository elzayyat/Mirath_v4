import React, { useRef, useState, useCallback, useEffect } from 'react';
import Tree from 'react-d3-tree';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ZoomIn, ZoomOut, Maximize2, Download, Info, X, Users, User, Shield, AlertCircle } from 'lucide-react';
import { toPng } from 'html-to-image';
import { useLanguage } from '@/hooks/useLanguage';

export interface TreeNodeData {
  name: string;
  nameAr?: string;
  type: string;
  share?: number;
  shareFraction?: string;
  shareAmount?: number;
  isBlocked?: boolean;
  blockedReason?: string;
  isAsaba?: boolean;
  gender?: 'male' | 'female';
  children?: TreeNodeData[];
  attributes?: {
    share?: string;
    type?: string;
    amount?: string;
  };
}

interface FamilyTreeProps {
  data: TreeNodeData;
  onNodeClick?: (node: TreeNodeData) => void;
  className?: string;
}

const CustomNode = ({ nodeDatum, onNodeClick, t }: any) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const isBlocked = nodeDatum.attributes?.isBlocked === 'true';
  const isAsaba = nodeDatum.attributes?.isAsaba === 'true';
  const sharePercent = nodeDatum.attributes?.share ? parseFloat(nodeDatum.attributes.share) * 100 : 0;

  const getNodeColor = () => {
    if (isBlocked) return '#9ca3af'; // Gray for blocked
    if (nodeDatum.name === 'Deceased' || nodeDatum.name === 'المتوفى') return '#d4af37'; // Gold for deceased
    if (isAsaba) return '#0a2e36'; // Dark green for Asaba
    return '#1a5a5a'; // Regular green
  };

  const getNodeBorder = () => {
    if (isBlocked) return 'border-gray-400';
    if (nodeDatum.name === 'Deceased' || nodeDatum.name === 'المتوفى') return 'border-gold';
    return 'border-emerald-dark';
  };

  return (
    <TooltipProvider>
      <Tooltip open={showTooltip} onOpenChange={setShowTooltip}>
        <TooltipTrigger asChild>
          <g onClick={() => onNodeClick?.(nodeDatum)} style={{ cursor: 'pointer' }}>
            {/* Node Circle */}
            <circle
              r="28"
              fill={getNodeColor()}
              stroke={getNodeBorder()}
              strokeWidth="2"
              className="transition-all duration-200 hover:shadow-lg"
            />
            
            {/* Gender Icon */}
            <text x="0" y="-8" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold">
              {nodeDatum.name === 'Deceased' || nodeDatum.name === 'المتوفى' ? 'م' : 
               nodeDatum.attributes?.gender === 'male' ? '♂' : 
               nodeDatum.attributes?.gender === 'female' ? '♀' : '👤'}
            </text>
            
            {/* Share Percentage */}
            {sharePercent > 0 && !isBlocked && (
              <text x="0" y="12" textAnchor="middle" fill="white" fontSize="10">
                {sharePercent.toFixed(1)}%
              </text>
            )}
            
            {/* Blocked Indicator */}
            {isBlocked && (
              <>
                <circle r="32" fill="none" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="4,4" />
                <text x="0" y="12" textAnchor="middle" fill="#ef4444" fontSize="10">محجوب</text>
              </>
            )}
            
            {/* Name Label */}
            <text
              x="0"
              y="45"
              textAnchor="middle"
              fill={isBlocked ? '#9ca3af' : '#1a1a1a'}
              fontSize="11"
              fontWeight="500"
            >
              {nodeDatum.name.length > 15 ? nodeDatum.name.substring(0, 12) + '...' : nodeDatum.name}
            </text>
            
            {/* Type Label */}
            {nodeDatum.attributes?.type && (
              <text
                x="0"
                y="58"
                textAnchor="middle"
                fill="#6b7280"
                fontSize="9"
              >
                {nodeDatum.attributes.type}
              </text>
            )}
          </g>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <div className="space-y-1 p-1">
            <p className="font-semibold text-sm">{nodeDatum.name}</p>
            {nodeDatum.nameAr && <p className="text-xs text-muted-foreground font-arabic">{nodeDatum.nameAr}</p>}
            {nodeDatum.attributes?.type && <p className="text-xs">Type: {nodeDatum.attributes.type}</p>}
            {sharePercent > 0 && !isBlocked && (
              <p className="text-xs text-gold">Share: {sharePercent.toFixed(2)}%</p>
            )}
            {nodeDatum.attributes?.amount && (
              <p className="text-xs">Amount: {nodeDatum.attributes.amount}</p>
            )}
            {isAsaba && <p className="text-xs text-emerald-dark">عصبة (Asaba)</p>}
            {isBlocked && nodeDatum.attributes?.blockedReason && (
              <p className="text-xs text-red-500">Blocked: {nodeDatum.attributes.blockedReason}</p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export const FamilyTree: React.FC<FamilyTreeProps> = ({ data, onNodeClick, className }) => {
  const treeContainerRef = useRef<HTMLDivElement>(null);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [zoomLevel, setZoomLevel] = useState(1);
  const { language, t } = useLanguage();

  useEffect(() => {
    if (treeContainerRef.current) {
      const rect = treeContainerRef.current.getBoundingClientRect();
      setDimensions({ width: rect.width, height: rect.height });
      setTranslate({ x: rect.width / 2, y: 80 });
    }

    const handleResize = () => {
      if (treeContainerRef.current) {
        const rect = treeContainerRef.current.getBoundingClientRect();
        setDimensions({ width: rect.width, height: rect.height });
        setTranslate({ x: rect.width / 2, y: 80 });
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.1, 2));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.1, 0.5));
  };

  const handleResetView = () => {
    setZoomLevel(1);
    if (treeContainerRef.current) {
      const rect = treeContainerRef.current.getBoundingClientRect();
      setTranslate({ x: rect.width / 2, y: 80 });
    }
  };

  const handleDownloadImage = async () => {
    if (treeContainerRef.current) {
      try {
        const dataUrl = await toPng(treeContainerRef.current, {
          quality: 0.95,
          backgroundColor: '#ffffff',
        });
        const link = document.createElement('a');
        link.download = 'family-tree.png';
        link.href = dataUrl;
        link.click();
      } catch (error) {
        console.error('Failed to download image:', error);
      }
    }
  };

  const foreignObjectProps = { width: 120, height: 80, x: -60, y: -40 };

  return (
    <Card className={`border-gold/20 shadow-lg ${className || ''}`}>
      <CardHeader className="bg-gradient-to-r from-emerald-dark/5 to-transparent">
        <div className="flex justify-between items-center flex-wrap gap-4">
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-gold" />
            Family Tree Visualization
            <span className="text-gold font-arabic text-sm">شجرة العائلة</span>
          </CardTitle>
          <div className="flex gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="sm" onClick={handleZoomIn}>
                    <ZoomIn className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Zoom In</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="sm" onClick={handleZoomOut}>
                    <ZoomOut className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Zoom Out</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="sm" onClick={handleResetView}>
                    <Maximize2 className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Reset View</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="sm" onClick={handleDownloadImage}>
                    <Download className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Download as Image</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div
          ref={treeContainerRef}
          style={{ width: '100%', height: '600px', background: '#fafafa' }}
          className="relative overflow-hidden rounded-b-lg"
        >
          {dimensions.width > 0 && (
            <Tree
              data={data}
              translate={translate}
              orientation="vertical"
              pathFunc="step"
              zoom={zoomLevel}
              zoomable={true}
              collapsible={true}
              initialDepth={2}
              nodeSize={{ x: 180, y: 120 }}
              separation={{ siblings: 1.2, nonSiblings: 1.5 }}
              renderCustomNodeElement={(rd3tProps) => (
                <CustomNode {...rd3tProps} onNodeClick={onNodeClick} t={t} />
              )}
              pathClassFunc={() => 'tree-path'}
            />
          )}
        </div>
        
        {/* Legend */}
        <div className="flex flex-wrap gap-4 p-4 border-t border-gold/20 bg-muted/20">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-gold" />
            <span className="text-xs">Deceased (المتوفى)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-emerald-dark" />
            <span className="text-xs">Asaba Heir (عصبة)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-[#1a5a5a]" />
            <span className="text-xs">Regular Heir (وارث)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-gray-400" />
            <span className="text-xs">Blocked Heir (محجوب)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full border-2 border-red-500 border-dashed" />
            <span className="text-xs">Blocked (ممنوع)</span>
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <Info className="w-3 h-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Click on any node for details</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default FamilyTree;