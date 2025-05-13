export const TAG_CONFIG = {
    Assignment: { title: "Assign.", bgColor: "bg-red-100", textColor: "text-red-700" },
    Viva: { title: "Viva", bgColor: "bg-pink-100", textColor: "text-pink-700" },
    Quiz: { title: "Quiz", bgColor: "bg-blue-100", textColor: "text-blue-700" },
    Mid: { title: "Mid", bgColor: "bg-orange-100", textColor: "text-orange-700" },
    Final: { title: "Final", bgColor: "bg-purple-100", textColor: "text-purple-700" },
    Project: { title: "Proj.", bgColor: "bg-green-100", textColor: "text-green-700" },
    CCP: { title: "CCP", bgColor: "bg-yellow-100", textColor: "text-yellow-700" },
    Other: { title: "Other", bgColor: "bg-gray-100", textColor: "text-gray-700" }
} as const;

export const VALID_TAGS = Object.keys(TAG_CONFIG) as readonly (keyof typeof TAG_CONFIG)[];
export type ValidTag = keyof typeof TAG_CONFIG;