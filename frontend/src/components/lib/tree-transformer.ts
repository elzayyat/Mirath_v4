import { HeirShare, CalculationResult } from '@/types/inheritance';

export interface FamilyTreeNode {
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
  children?: FamilyTreeNode[];
  attributes?: {
    share?: string;
    type?: string;
    amount?: string;
    isBlocked?: string;
    isAsaba?: string;
    gender?: string;
    blockedReason?: string;
  };
}

// Map heir types to Arabic names
const heirTypeToArabic: Record<string, string> = {
  'Husband': 'الزوج',
  'Wife': 'الزوجة',
  'Father': 'الأب',
  'Mother': 'الأم',
  'Son': 'الابن',
  'Daughter': 'البنت',
  'GrandFather': 'الجد',
  'GrandMother': 'الجدة',
  'GrandSon': 'ابن الابن',
  'GrandDaughter': 'بنت الابن',
  'Brother': 'الأخ الشقيق',
  'Sister': 'الأخت الشقيقة',
  'PaternalBrother': 'الأخ لأب',
  'PaternalSister': 'الأخت لأب',
  'MaternalBrother': 'الأخ لأم',
  'MaternalSister': 'الأخت لأم',
  'FullBrother': 'الأخ الشقيق',
  'FullSister': 'الأخت الشقيقة',
};

// Define family hierarchy order
const hierarchyOrder: Record<string, number> = {
  'Deceased': 0,
  'Husband': 1,
  'Wife': 1,
  'Father': 1,
  'Mother': 1,
  'Son': 2,
  'Daughter': 2,
  'GrandSon': 3,
  'GrandDaughter': 3,
  'Brother': 2,
  'Sister': 2,
  'GrandFather': 2,
  'GrandMother': 2,
};

export function transformToTreeData(
  calculationResult: CalculationResult,
  deceasedName: string = 'Deceased',
  language: 'en' | 'ar' = 'en'
): FamilyTreeNode {
  const { shares, isAwlApplied, isRaddApplied, netEstate } = calculationResult;
  
  // Create root node (deceased)
  const root: FamilyTreeNode = {
    name: language === 'en' ? deceasedName : 'المتوفى',
    nameAr: 'المتوفى',
    type: 'Deceased',
    gender: 'male',
    attributes: {
      type: 'Deceased',
      gender: 'male',
    },
    children: [],
  };

  // Group heirs by type and organize hierarchy
  const heirMap = new Map<string, FamilyTreeNode>();
  
  for (const share of shares) {
    const node: FamilyTreeNode = {
      name: language === 'en' ? share.heirName : heirTypeToArabic[share.heirType] || share.heirName,
      nameAr: heirTypeToArabic[share.heirType] || share.heirName,
      type: share.heirType,
      share: share.percentage,
      shareFraction: share.fraction,
      shareAmount: share.amount,
      isAsaba: share.shareType === 'Asaba',
      gender: getGenderForHeirType(share.heirType),
      attributes: {
        share: share.percentage.toString(),
        type: share.shareType,
        amount: `$${share.amount.toFixed(2)}`,
        isAsaba: (share.shareType === 'Asaba').toString(),
        gender: getGenderForHeirType(share.heirType),
      },
    };
    
    heirMap.set(share.heirType, node);
  }

  // Build hierarchy relationships
  for (const [type, node] of heirMap) {
    const parentType = getParentType(type);
    if (parentType === 'Deceased') {
      root.children!.push(node);
    } else if (heirMap.has(parentType)) {
      const parent = heirMap.get(parentType);
      if (parent) {
        if (!parent.children) parent.children = [];
        parent.children.push(node);
      }
    } else {
      root.children!.push(node);
    }
  }

  // Sort children by hierarchy order
  const sortChildren = (node: FamilyTreeNode) => {
    if (node.children && node.children.length > 0) {
      node.children.sort((a, b) => {
        const orderA = hierarchyOrder[a.type] || 99;
        const orderB = hierarchyOrder[b.type] || 99;
        return orderA - orderB;
      });
      node.children.forEach(sortChildren);
    }
  };
  
  sortChildren(root);

  // Add special indicators
  if (isAwlApplied) {
    root.attributes = {
      ...root.attributes,
      note: 'Awl applied - shares proportionally reduced',
    };
  }
  
  if (isRaddApplied) {
    root.attributes = {
      ...root.attributes,
      note: 'Radd applied - surplus returned to heirs',
    };
  }

  return root;
}

function getGenderForHeirType(type: string): 'male' | 'female' {
  const maleTypes = ['Husband', 'Father', 'Son', 'GrandFather', 'GrandSon', 'Brother', 'PaternalBrother', 'MaternalBrother', 'FullBrother'];
  const femaleTypes = ['Wife', 'Mother', 'Daughter', 'GrandMother', 'GrandDaughter', 'Sister', 'PaternalSister', 'MaternalSister', 'FullSister'];
  
  if (maleTypes.includes(type)) return 'male';
  if (femaleTypes.includes(type)) return 'female';
  return 'male';
}

function getParentType(type: string): string {
  const parentMap: Record<string, string> = {
    'Son': 'Deceased',
    'Daughter': 'Deceased',
    'GrandSon': 'Son',
    'GrandDaughter': 'Son',
    'Brother': 'Father',
    'Sister': 'Father',
    'PaternalBrother': 'Father',
    'PaternalSister': 'Father',
    'MaternalBrother': 'Mother',
    'MaternalSister': 'Mother',
    'Father': 'Deceased',
    'Mother': 'Deceased',
    'Husband': 'Deceased',
    'Wife': 'Deceased',
    'GrandFather': 'Father',
    'GrandMother': 'Mother',
  };
  
  return parentMap[type] || 'Deceased';
}

export function addBlockedHeirs(
  treeData: FamilyTreeNode,
  blockedHeirs: Array<{ type: string; name: string; reason: string }>
): FamilyTreeNode {
  const blockedTypes = new Set(blockedHeirs.map(b => b.type));
  const blockedMap = new Map(blockedHeirs.map(b => [b.type, b]));
  
  const markBlocked = (node: FamilyTreeNode): FamilyTreeNode => {
    if (blockedTypes.has(node.type)) {
      const blockedInfo = blockedMap.get(node.type);
      return {
        ...node,
        isBlocked: true,
        blockedReason: blockedInfo?.reason,
        attributes: {
          ...node.attributes,
          isBlocked: 'true',
          blockedReason: blockedInfo?.reason,
        },
        share: 0,
        shareAmount: 0,
        children: node.children?.map(markBlocked) || [],
      };
    }
    
    return {
      ...node,
      children: node.children?.map(markBlocked) || [],
    };
  };
  
  return markBlocked(treeData);
}