export const FILE_CATEGORIES = ["试卷", "作业", "课件", "讲义", "实验", "代码"] as const;
export type FileCategory = (typeof FILE_CATEGORIES)[number];
