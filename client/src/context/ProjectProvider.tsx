import { createContext, useContext, useState, ReactNode } from "react";

type Project = {
  name: string;
  twitterHandle: string;
};

type ProjectContextType = {
  project: Project | null;
  setProject: React.Dispatch<React.SetStateAction<Project | null>>;
};

const ProjectContext = createContext<ProjectContextType | undefined>(
  undefined
);

type ProjectProviderProps = {
  children: ReactNode;
};

export function ProjectProvider({ children }: ProjectProviderProps) {
  const [project, setProject] = useState<Project | null>(null);

  return (
    <ProjectContext.Provider value={{ project, setProject }}>
      {children}
    </ProjectContext.Provider>
  );
}

export function useProject() {
  const context = useContext(ProjectContext);

  if (!context) {
    throw new Error("useProject must be used within a ProjectProvider");
  }

  return context;
}
