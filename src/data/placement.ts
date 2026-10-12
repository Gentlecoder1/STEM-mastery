import type { SubjectId } from '../theme';

export const PLACEMENT_PASS_RATIO = 0.6;

export type PlacementOption = {
  id: string;
  label: string;
  text: string;
};

export type PlacementQuestion = {
  id: string;
  prompt: string;
  options: readonly PlacementOption[];
  answerId: string;
  explanation: string;
};

export const PLACEMENT_QUESTIONS: Record<SubjectId, readonly PlacementQuestion[]> = {
  physics: [
    {
      id: 'phys-1',
      prompt: 'Which quantity measures how fast something moves in a given direction?',
      options: [
        { id: 'a', label: 'A', text: 'Distance' },
        { id: 'b', label: 'B', text: 'Speed' },
        { id: 'c', label: 'C', text: 'Velocity' },
        { id: 'd', label: 'D', text: 'Mass' },
      ],
      answerId: 'c',
      explanation: 'Velocity describes speed together with a direction.',
    },
    {
      id: 'phys-2',
      prompt: 'What is the SI unit of force?',
      options: [
        { id: 'a', label: 'A', text: 'Joule' },
        { id: 'b', label: 'B', text: 'Newton' },
        { id: 'c', label: 'C', text: 'Watt' },
        { id: 'd', label: 'D', text: 'Pascal' },
      ],
      answerId: 'b',
      explanation: 'Force is measured in newtons (N).',
    },
    {
      id: 'phys-3',
      prompt: 'On a distance–time graph, a steeper line means the object is…',
      options: [
        { id: 'a', label: 'A', text: 'Moving faster' },
        { id: 'b', label: 'B', text: 'At rest' },
        { id: 'c', label: 'C', text: 'Slowing down' },
        { id: 'd', label: 'D', text: 'Standing still' },
      ],
      answerId: 'a',
      explanation: 'A steeper slope shows a greater speed.',
    },
  ],
  mathematics: [
    {
      id: 'math-1',
      prompt: 'Solve for x: 2x + 5 = 15.',
      options: [
        { id: 'a', label: 'A', text: '3' },
        { id: 'b', label: 'B', text: '4' },
        { id: 'c', label: 'C', text: '5' },
        { id: 'd', label: 'D', text: '10' },
      ],
      answerId: 'c',
      explanation: '2x = 10, so x = 5.',
    },
    {
      id: 'math-2',
      prompt: 'What is 15% of 200?',
      options: [
        { id: 'a', label: 'A', text: '15' },
        { id: 'b', label: 'B', text: '30' },
        { id: 'c', label: 'C', text: '20' },
        { id: 'd', label: 'D', text: '45' },
      ],
      answerId: 'b',
      explanation: '15% of 200 = 0.15 × 200 = 30.',
    },
    {
      id: 'math-3',
      prompt: 'Simplify: 3(x + 2) − x.',
      options: [
        { id: 'a', label: 'A', text: '2x + 6' },
        { id: 'b', label: 'B', text: '3x + 6' },
        { id: 'c', label: 'C', text: '2x + 2' },
        { id: 'd', label: 'D', text: '4x + 2' },
      ],
      answerId: 'a',
      explanation: '3x + 6 − x = 2x + 6.',
    },
  ],
  chemistry: [
    {
      id: 'chem-1',
      prompt: 'What is the chemical formula for water?',
      options: [
        { id: 'a', label: 'A', text: 'CO₂' },
        { id: 'b', label: 'B', text: 'H₂O' },
        { id: 'c', label: 'C', text: 'O₂' },
        { id: 'd', label: 'D', text: 'NaCl' },
      ],
      answerId: 'b',
      explanation: 'Water is made of two hydrogen atoms and one oxygen atom: H₂O.',
    },
    {
      id: 'chem-2',
      prompt: 'Which particle in an atom has a negative charge?',
      options: [
        { id: 'a', label: 'A', text: 'Proton' },
        { id: 'b', label: 'B', text: 'Neutron' },
        { id: 'c', label: 'C', text: 'Electron' },
        { id: 'd', label: 'D', text: 'Nucleus' },
      ],
      answerId: 'c',
      explanation: 'Electrons carry a negative charge.',
    },
    {
      id: 'chem-3',
      prompt: 'What is the atomic number of an element equal to?',
      options: [
        { id: 'a', label: 'A', text: 'Number of neutrons' },
        { id: 'b', label: 'B', text: 'Number of protons' },
        { id: 'c', label: 'C', text: 'Number of shells' },
        { id: 'd', label: 'D', text: 'Atomic mass' },
      ],
      answerId: 'b',
      explanation: 'The atomic number is the number of protons in the nucleus.',
    },
  ],
};

export function getPlacementQuestions(subjectId: SubjectId): readonly PlacementQuestion[] {
  return PLACEMENT_QUESTIONS[subjectId] ?? [];
}
