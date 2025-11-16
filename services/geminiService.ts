import { GoogleGenAI, Type } from '@google/genai';
import type { AppData, Project, OptimizedResult, WorkExperience, Skill, SkillCategory, ProjectEntry } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set");
}
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

function formatProjectsForPrompt(projects: Project[]): string {
  return projects
    .map(
      (p) => `
### ${p.title} - ${p.year}
**${p.subtitle}**
${p.description.map((d) => `- ${d}`).join('\n')}
`
    )
    .join('\n---\n');
}

function formatWorkExperiencesForPrompt(experiences: WorkExperience[]): string {
  return experiences
    .map(
      (exp) => `
### ${exp.company} - ${exp.role} (${exp.dates})
${exp.bullets.map((b) => `- ${b}`).join('\n')}
`
    )
    .join('\n---\n');
}

/**
 * Step 1: Optimize work experience and project bullets based on job posting
 */
export const optimizeBullets = async (
  jobPosting: string,
  jobPostingScreenshot: string | undefined,
  workExperiences: WorkExperience[],
  selectedProjects: Project[]
): Promise<{ optimizedWorkExperience: WorkExperience[], optimizedProjects: ProjectEntry[] }> => {
  const model = 'gemini-2.5-flash';
  
  const systemInstruction = `You are a resume optimizer. Rewrite bullet points to match the job posting keywords while keeping company names, titles, and dates unchanged. Use action verbs and quantify achievements. Keep bullets concise (1-2 lines).`;

  const textPrompt = `Job Posting:
${jobPosting}

Work Experience:
${formatWorkExperiencesForPrompt(workExperiences)}

Projects:
${formatProjectsForPrompt(selectedProjects)}

Optimize bullets for this job.`;

  let contents: any = textPrompt;
  const parts: any[] = [{ text: textPrompt }];

  if (jobPostingScreenshot) {
    parts.push({
      inlineData: {
        mimeType: 'image/jpeg',
        data: jobPostingScreenshot,
      },
    });
  }

  if (parts.length > 1) {
    contents = { parts };
  }

  const response = await ai.models.generateContent({
    model,
    contents,
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          optimizedWorkExperience: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                company: { type: Type.STRING },
                role: { type: Type.STRING },
                dates: { type: Type.STRING },
                bullets: { type: Type.ARRAY, items: { type: Type.STRING } }
              },
              required: ["id", "company", "role", "dates", "bullets"]
            }
          },
          optimizedProjects: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                company: { type: Type.STRING },
                dates: { type: Type.STRING },
                minor_desc: { type: Type.STRING },
                bullets: { type: Type.ARRAY, items: { type: Type.STRING } }
              },
              required: ["company", "dates", "minor_desc", "bullets"]
            }
          }
        },
        required: ["optimizedWorkExperience", "optimizedProjects"]
      }
    }
  });

  const jsonText = response.text.trim();
  try {
    const result = JSON.parse(jsonText);
    return result;
  } catch (error) {
    console.error("Failed to parse bullet optimization response:", jsonText);
    throw new Error("Could not optimize bullets. The AI returned an unexpected format.");
  }
};

/**
 * Step 2: Categorize skills based on job posting relevance
 */
export const categorizeSkills = async (
  jobPosting: string,
  jobPostingScreenshot: string | undefined,
  skills: Skill[]
): Promise<SkillCategory[]> => {
  const model = 'gemini-2.5-flash';
  
  const systemInstruction = `Categorize technical skills for a resume based on job relevance. Create 3-5 categories (e.g., "Frontend", "Backend", "DevOps") with skills as comma-separated strings, ordered by relevance.`;

  const skillsList = skills.map(s => s.skill_name).join(', ');

  const textPrompt = `Job Posting:
${jobPosting}

Skills:
${skillsList}

Categorize by relevance.`;

  let contents: any = textPrompt;
  const parts: any[] = [{ text: textPrompt }];

  if (jobPostingScreenshot) {
    parts.push({
      inlineData: {
        mimeType: 'image/jpeg',
        data: jobPostingScreenshot,
      },
    });
  }

  if (parts.length > 1) {
    contents = { parts };
  }

  const response = await ai.models.generateContent({
    model,
    contents,
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            items: { type: Type.STRING }
          },
          required: ["title", "items"]
        }
      }
    }
  });

  const jsonText = response.text.trim();
  try {
    const result = JSON.parse(jsonText);
    return result;
  } catch (error) {
    console.error("Failed to parse skill categorization response:", jsonText);
    throw new Error("Could not categorize skills. The AI returned an unexpected format.");
  }
};

/**
 * Step 3: Generate personalized cover letter with company value analysis
 */
export const generateCoverLetter = async (
  jobPosting: string,
  jobPostingScreenshot: string | undefined,
  companyName: string,
  optimizedWorkExperience: WorkExperience[],
  optimizedProjects: ProjectEntry[],
  additionalInfo?: string
): Promise<string> => {
  const model = 'gemini-2.5-flash';
  
  const systemInstruction = `Write a 3-paragraph cover letter: 1) Why interested (mention company values), 2) Relevant experience (2-3 examples with achievements), 3) Enthusiasm to contribute. Professional, concise, tailored. Plain text only.`;

  const additionalInfoSection = additionalInfo 
    ? `\n## Additional Context from Applicant\n\`\`\`\n${additionalInfo}\n\`\`\`\n` 
    : '';

  const textPrompt = `Job: ${jobPosting}

Company: ${companyName}

Experience:
${formatWorkExperiencesForPrompt(optimizedWorkExperience)}

Projects:
${optimizedProjects.map(p => `${p.company} (${p.dates}) - ${p.minor_desc}\n${p.bullets.join('\n')}`).join('\n---\n')}
${additionalInfoSection}

Write cover letter.`;

  let contents: any = textPrompt;
  const parts: any[] = [{ text: textPrompt }];

  if (jobPostingScreenshot) {
    parts.push({
      inlineData: {
        mimeType: 'image/jpeg',
        data: jobPostingScreenshot,
      },
    });
  }

  if (parts.length > 1) {
    contents = { parts };
  }

  const response = await ai.models.generateContent({
    model,
    contents,
    config: {
      systemInstruction,
      responseMimeType: "text/plain"
    }
  });

  return response.text.trim();
};


export const formatNewProject = async (rawText: string, existingProjects: Project[]): Promise<Omit<Project, 'id'>> => {
  const model = 'gemini-2.5-flash';

  const systemInstruction = `You are a helpful assistant that formats project descriptions for a resume. The user will provide a raw text description of a new project and a list of their existing projects as style examples. Your task is to parse the raw text and format it into a structured JSON object that matches the style of the examples.

  The JSON object must have the following properties:
  - title (string): The project title, usually in ALL CAPS.
  - year (number): The year the project was completed.
  - subtitle (string): A brief, descriptive subtitle.
  - description (array of strings): A list of bullet points describing the project details and achievements.

  Analyze the existing projects to understand the tone, phrasing, and level of detail, and apply it to the new project.`;

  const prompt = `
  ## Style Examples (Existing Projects)
  \`\`\`
  ${formatProjectsForPrompt(existingProjects)}
  \`\`\`

  ## New Project (Raw Text)
  \`\`\`
  ${rawText}
  \`\`\`

  Please parse the new project raw text and return it as a single JSON object following the required schema and matching the style of the examples.
  `;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          year: { type: Type.NUMBER },
          subtitle: { type: Type.STRING },
          description: { 
            type: Type.ARRAY,
            items: { type: Type.STRING }
          },
        },
        required: ["title", "year", "subtitle", "description"],
      }
    }
  });

  const jsonText = response.text.trim();
  try {
    const result = JSON.parse(jsonText);
    return result;
  } catch (error) {
    console.error("Failed to parse project formatting response:", jsonText);
    throw new Error("The AI failed to format the project correctly. Please try again or add it manually.");
  }
};

export const suggestProjects = async (jobPosting: string, allProjects: Project[]): Promise<string[]> => {
    const model = 'gemini-2.5-flash';

    const systemInstruction = `Select the 3 most relevant project IDs for this job based on matching technologies, skills, and responsibilities. Return as JSON array.`;

    const prompt = `Job: ${jobPosting}

Projects:
${allProjects.map(p => `ID: ${p.id}\n${p.title} - ${p.subtitle}\n${p.description.join('; ')}`).join('\n---\n')}

Return top 3 IDs.`;

    const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
            systemInstruction,
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
            }
        }
    });

    const jsonText = response.text.trim();
    try {
        const projectIds = JSON.parse(jsonText);
        return projectIds;
    } catch (error) {
        console.error("Failed to parse project suggestions:", jsonText);
        throw new Error("The AI failed to suggest projects correctly. Please select manually.");
    }
};
