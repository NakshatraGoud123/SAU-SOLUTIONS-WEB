export interface TeamMember {
  id: string
  name: string
  designation: string
  bio: string
  responsibilities: string[]
  linkedin: string | null
  initials: string
}

export const foundingTeam: TeamMember[] = [
  {
    id: 'founder-1',
    name: 'Founder 1',
    designation: 'Name and designation to be provided',
    bio: 'Placeholder profile for the first founder. Replace this entry with the approved founder biography, designation, and official LinkedIn profile when available.',
    responsibilities: ['Responsibilities to be provided'],
    linkedin: null,
    initials: 'F1',
  },
  {
    id: 'founder-2',
    name: 'Founder 2',
    designation: 'Name and designation to be provided',
    bio: 'Placeholder profile for the second founder. Replace this entry with the approved founder biography, designation, and official LinkedIn profile when available.',
    responsibilities: ['Responsibilities to be provided'],
    linkedin: null,
    initials: 'F2',
  },
  {
    id: 'founder-3',
    name: 'Founder 3',
    designation: 'Name and designation to be provided',
    bio: 'Placeholder profile for the third founder. Replace this entry with the approved founder biography, designation, and official LinkedIn profile when available.',
    responsibilities: ['Responsibilities to be provided'],
    linkedin: null,
    initials: 'F3',
  },
]
