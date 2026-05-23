import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import FamilyTree from '@/components/family-tree/FamilyTree';
import NodeDetailsModal from '@/components/family-tree/NodeDetailsModal';
import { transformToTreeData, addBlockedHeirs } from '@/lib/tree-transformer';
import { TreeNodeData } from '@/components/family-tree/FamilyTree';

// Add to existing ResultsDisplay component
const ResultsDisplay = ({ result, deceased, madhab, onBack, onReset }: ResultsDisplayProps) => {
  const [selectedNode, setSelectedNode] = useState<TreeNodeData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { language } = useLanguage();

  // Transform calculation results to tree data
  const treeData = transformToTreeData(result, deceased.name || 'Deceased', language);
  
  // Add blocked heirs if any
  const blockedHeirs = result.blockedHeirs || [];
  const finalTreeData = blockedHeirs.length > 0 
    ? addBlockedHeirs(treeData, blockedHeirs)
    : treeData;

  const handleNodeClick = (node: TreeNodeData) => {
    setSelectedNode(node);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Existing tabs: Table, Pie Chart, Bar Chart */}
      <Tabs defaultValue="table" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-4">
          <TabsTrigger value="table">Table</TabsTrigger>
          <TabsTrigger value="pie">Pie Chart</TabsTrigger>
          <TabsTrigger value="bar">Bar Chart</TabsTrigger>
          <TabsTrigger value="tree">Family Tree</TabsTrigger> {/* New Tab */}
        </TabsList>

        {/* Existing TabsContent for table, pie, bar... */}

        <TabsContent value="tree" className="mt-4">
          <FamilyTree 
            data={finalTreeData} 
            onNodeClick={handleNodeClick}
          />
        </TabsContent>
      </Tabs>

      {/* Node Details Modal */}
      <NodeDetailsModal
        node={selectedNode}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        language={language}
      />
    </div>
  );
};