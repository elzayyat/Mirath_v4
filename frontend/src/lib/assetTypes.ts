// All inheritable asset types in Islamic estate

export interface AssetTypeDef {
  id: string;
  label: string;
  labelAr: string;
  icon: string;
  category: string;
  categoryAr: string;
  fields: AssetField[];
  description: string;
  descriptionAr: string;
  valuationNote: string;
  valuationNoteAr: string;
}

export interface AssetField {
  key: string;
  label: string;
  labelAr: string;
  type: 'number' | 'text' | 'select';
  unit?: string;
  placeholder?: string;
  options?: { value: string; label: string; labelAr: string }[];
  required?: boolean;
}

export const ASSET_TYPES: AssetTypeDef[] = [
  {
    id: 'cash',
    label: 'Cash & Bank Accounts',
    labelAr: 'نقد وحسابات بنكية',
    icon: '💵',
    category: 'Liquid Assets',
    categoryAr: 'الأصول السائلة',
    fields: [
      { key: 'description', label: 'Description', labelAr: 'الوصف', type: 'text', placeholder: 'Bank name / account description' },
      { key: 'value', label: 'Amount', labelAr: 'المبلغ', type: 'number', unit: 'EGP', required: true },
      { key: 'currency', label: 'Currency', labelAr: 'العملة', type: 'select', options: [
        { value: 'EGP', label: 'EGP', labelAr: 'جنيه مصري' },
        { value: 'USD', label: 'USD', labelAr: 'دولار أمريكي' },
        { value: 'SAR', label: 'SAR', labelAr: 'ريال سعودي' },
        { value: 'AED', label: 'AED', labelAr: 'درهم إماراتي' },
        { value: 'KWD', label: 'KWD', labelAr: 'دينار كويتي' },
      ]},
    ],
    description: 'Physical cash, savings accounts, current accounts, fixed deposits.',
    descriptionAr: 'النقد والودائع والحسابات الجارية وشهادات الادخار.',
    valuationNote: 'Face value as of date of death.',
    valuationNoteAr: 'القيمة الاسمية في تاريخ الوفاة.',
  },
  {
    id: 'gold',
    label: 'Gold',
    labelAr: 'ذهب',
    icon: '🪙',
    category: 'Precious Metals',
    categoryAr: 'المعادن الثمينة',
    fields: [
      { key: 'description', label: 'Description', labelAr: 'الوصف', type: 'text', placeholder: 'Jewelry, bullion, coins...' },
      { key: 'weight', label: 'Weight (grams)', labelAr: 'الوزن (جرام)', type: 'number', unit: 'g', required: true },
      { key: 'karat', label: 'Karat', labelAr: 'العيار', type: 'select', options: [
        { value: '24', label: '24K (999)', labelAr: '24 قيراط (999)' },
        { value: '21', label: '21K (875)', labelAr: '21 قيراط (875)' },
        { value: '18', label: '18K (750)', labelAr: '18 قيراط (750)' },
        { value: '14', label: '14K (585)', labelAr: '14 قيراط (585)' },
      ]},
      { key: 'value', label: 'Estimated Value', labelAr: 'القيمة التقديرية', type: 'number', required: true },
    ],
    description: 'Gold jewelry, coins, bullion bars.',
    descriptionAr: 'مجوهرات الذهب والسبائك والعملات الذهبية.',
    valuationNote: 'Market value at date of death. Nisab for Zakah is 85g of 24K gold.',
    valuationNoteAr: 'القيمة السوقية يوم الوفاة. نصاب الزكاة 85 جراماً من الذهب عيار 24.',
  },
  {
    id: 'silver',
    label: 'Silver',
    labelAr: 'فضة',
    icon: '⚪',
    category: 'Precious Metals',
    categoryAr: 'المعادن الثمينة',
    fields: [
      { key: 'description', label: 'Description', labelAr: 'الوصف', type: 'text', placeholder: 'Jewelry, cutlery, coins...' },
      { key: 'weight', label: 'Weight (grams)', labelAr: 'الوزن (جرام)', type: 'number', unit: 'g', required: true },
      { key: 'value', label: 'Estimated Value', labelAr: 'القيمة التقديرية', type: 'number', required: true },
    ],
    description: 'Silver jewelry, cutlery, coins, bullion.',
    descriptionAr: 'مجوهرات الفضة وأواني الطعام والعملات.',
    valuationNote: 'Market value at date of death. Nisab is 595g of silver.',
    valuationNoteAr: 'القيمة السوقية يوم الوفاة. نصاب الزكاة 595 جراماً من الفضة.',
  },
  {
    id: 'real_estate',
    label: 'Real Estate',
    labelAr: 'عقارات',
    icon: '🏠',
    category: 'Fixed Assets',
    categoryAr: 'الأصول الثابتة',
    fields: [
      { key: 'description', label: 'Property Description', labelAr: 'وصف العقار', type: 'text', placeholder: 'Apartment, Villa, Land...' },
      { key: 'location', label: 'Location', labelAr: 'الموقع', type: 'text', placeholder: 'City, Area, Street...' },
      { key: 'area', label: 'Area (m²)', labelAr: 'المساحة (م²)', type: 'number' },
      { key: 'value', label: 'Market Value', labelAr: 'القيمة السوقية', type: 'number', required: true },
    ],
    description: 'Apartments, villas, houses, land, commercial property.',
    descriptionAr: 'شقق وفلل ومنازل وأراضي ومحلات تجارية.',
    valuationNote: 'Current market value by licensed appraiser recommended.',
    valuationNoteAr: 'يُنصح بالتقييم من قِبَل مقيّم معتمد.',
  },
  {
    id: 'vehicle',
    label: 'Vehicles',
    labelAr: 'مركبات',
    icon: '🚗',
    category: 'Fixed Assets',
    categoryAr: 'الأصول الثابتة',
    fields: [
      { key: 'description', label: 'Vehicle Description', labelAr: 'وصف المركبة', type: 'text', placeholder: 'Toyota Camry 2020...' },
      { key: 'quantity', label: 'Quantity', labelAr: 'العدد', type: 'number' },
      { key: 'value', label: 'Market Value', labelAr: 'القيمة السوقية', type: 'number', required: true },
    ],
    description: 'Cars, trucks, motorcycles, boats, machinery.',
    descriptionAr: 'سيارات وشاحنات ودراجات نارية وقوارب وآلات.',
    valuationNote: 'Current market value or book value.',
    valuationNoteAr: 'القيمة السوقية الحالية أو القيمة الدفترية.',
  },
  {
    id: 'business',
    label: 'Business & Trade',
    labelAr: 'تجارة ومشاريع',
    icon: '🏪',
    category: 'Business Assets',
    categoryAr: 'أصول الأعمال',
    fields: [
      { key: 'description', label: 'Business Description', labelAr: 'وصف المشروع', type: 'text', placeholder: 'Grocery store, Factory, Restaurant...' },
      { key: 'share', label: 'Ownership Share (%)', labelAr: 'نسبة الملكية (%)', type: 'number' },
      { key: 'value', label: 'Value of Share', labelAr: 'قيمة الحصة', type: 'number', required: true },
    ],
    description: 'Business ownership, partnership shares, trading inventory.',
    descriptionAr: 'ملكية الشركات وحصص الشراكة وعروض التجارة.',
    valuationNote: 'عروض التجارة (Urood al-Tijarah) are Zakat-liable.',
    valuationNoteAr: 'عروض التجارة تجب فيها الزكاة إذا بلغت النصاب.',
  },
  {
    id: 'stocks',
    label: 'Stocks & Investments',
    labelAr: 'أسهم واستثمارات',
    icon: '📈',
    category: 'Business Assets',
    categoryAr: 'أصول الأعمال',
    fields: [
      { key: 'description', label: 'Description', labelAr: 'الوصف', type: 'text', placeholder: 'Company name, fund name...' },
      { key: 'quantity', label: 'Number of Shares', labelAr: 'عدد الأسهم', type: 'number' },
      { key: 'value', label: 'Total Market Value', labelAr: 'إجمالي القيمة السوقية', type: 'number', required: true },
    ],
    description: 'Publicly listed stocks, mutual funds, ETFs, sukuk.',
    descriptionAr: 'أسهم مدرجة في البورصة وصناديق استثمار وصكوك.',
    valuationNote: 'Market value on the date of death (closing price).',
    valuationNoteAr: 'القيمة السوقية في يوم الوفاة (سعر الإغلاق).',
  },
  {
    id: 'receivable',
    label: 'Debts Owed to Deceased',
    labelAr: 'ديون للمتوفى (مستحقة)',
    icon: '📋',
    category: 'Receivables',
    categoryAr: 'الديون المستحقة',
    fields: [
      { key: 'description', label: 'Debtor Name & Reason', labelAr: 'اسم المدين والسبب', type: 'text', required: true },
      { key: 'value', label: 'Amount', labelAr: 'المبلغ', type: 'number', required: true },
      { key: 'currency', label: 'Currency', labelAr: 'العملة', type: 'text', placeholder: 'EGP' },
    ],
    description: 'Money owed to the deceased by others — loans given, deferred payments.',
    descriptionAr: 'أموال مستحقة للمتوفى على الغير — قروض وديون.',
    valuationNote: 'Collectible debts are included in the estate. Doubtful debts — scholars differ.',
    valuationNoteAr: 'الديون المحتملة التحصيل تدخل التركة. الديون المشكوك فيها خلاف بين العلماء.',
  },
  {
    id: 'livestock',
    label: 'Livestock & Agriculture',
    labelAr: 'ماشية وزراعة',
    icon: '🐄',
    category: 'Agricultural',
    categoryAr: 'أصول زراعية',
    fields: [
      { key: 'description', label: 'Description', labelAr: 'الوصف', type: 'text', placeholder: 'Cattle, sheep, farmland, crops...' },
      { key: 'quantity', label: 'Quantity / Area', labelAr: 'الكمية / المساحة', type: 'number' },
      { key: 'value', label: 'Market Value', labelAr: 'القيمة السوقية', type: 'number', required: true },
    ],
    description: 'Cattle, sheep, camels, poultry, agricultural land, crops.',
    descriptionAr: 'بقر وأغنام وإبل ودواجن وأراضي زراعية ومحاصيل.',
    valuationNote: 'Livestock has Zakat thresholds (Nisab) per species.',
    valuationNoteAr: 'للمواشي نصاب زكاة خاص بكل نوع.',
  },
  {
    id: 'intellectual',
    label: 'Intellectual Property & Royalties',
    labelAr: 'ملكية فكرية وحقوق',
    icon: '©️',
    category: 'Intangible Assets',
    categoryAr: 'الأصول غير المادية',
    fields: [
      { key: 'description', label: 'Description', labelAr: 'الوصف', type: 'text', placeholder: 'Book royalties, patent, trademark...' },
      { key: 'value', label: 'Estimated Value', labelAr: 'القيمة التقديرية', type: 'number', required: true },
    ],
    description: 'Book royalties, patents, trademarks, copyrights.',
    descriptionAr: 'حقوق التأليف والنشر والبراءات والعلامات التجارية.',
    valuationNote: 'Scholars differ on inheritability. Value estimated from future income.',
    valuationNoteAr: 'العلماء يختلفون في توارثها. تُقدَّر بالدخل المستقبلي.',
  },
  {
    id: 'pension',
    label: 'Pension & Insurance',
    labelAr: 'معاشات وتأمينات',
    icon: '🛡️',
    category: 'Entitlements',
    categoryAr: 'المستحقات',
    fields: [
      { key: 'description', label: 'Description', labelAr: 'الوصف', type: 'text', placeholder: 'Pension fund, life insurance...' },
      { key: 'value', label: 'Amount', labelAr: 'المبلغ', type: 'number', required: true },
    ],
    description: 'Pension funds, end-of-service gratuity, life insurance.',
    descriptionAr: 'صناديق معاشات ومكافأة نهاية الخدمة والتأمين على الحياة.',
    valuationNote: 'Some scholars exclude life insurance proceeds from the estate.',
    valuationNoteAr: 'بعض العلماء يستثنون عائد التأمين من التركة.',
  },
  {
    id: 'other',
    label: 'Other Assets',
    labelAr: 'أصول أخرى',
    icon: '📦',
    category: 'Other',
    categoryAr: 'أخرى',
    fields: [
      { key: 'description', label: 'Description', labelAr: 'الوصف', type: 'text', required: true },
      { key: 'value', label: 'Value', labelAr: 'القيمة', type: 'number', required: true },
    ],
    description: 'Furniture, electronics, books, collectibles, crypto assets.',
    descriptionAr: 'أثاث وأجهزة إلكترونية وكتب ومقتنيات وأصول رقمية.',
    valuationNote: 'Market or fair value at date of death.',
    valuationNoteAr: 'القيمة السوقية أو العادلة في يوم الوفاة.',
  },
];

export function getAssetType(id: string): AssetTypeDef | undefined {
  return ASSET_TYPES.find(a => a.id === id);
}

export type AssetEntry = {
  id: string;
  typeId: string;
  description: string;
  value: number;
  currency: string;
  fields: Record<string, any>;
};
