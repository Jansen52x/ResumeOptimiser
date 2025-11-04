import { GoogleGenAI, Type } from '@google/genai';
import type { AppData, Project, OptimizedResult } from '../types';

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

export const optimizeApplication = async (
  appData: AppData
): Promise<OptimizedResult> => {

  const model = 'gemini-2.5-flash';
  
  const systemInstruction = `You are an expert career coach and professional resume writer. Your task is to help a job applicant tailor their resume and write a compelling cover letter for a specific job posting. You will be given a job posting, the applicant's current resume (either as text or an image), a curated list of their most relevant projects, an old resume for formatting reference, and a sample cover letter for inspiration.

Your response MUST be a JSON object that strictly follows this schema:
1.  **resume**: A string containing the full text of the optimized resume in Markdown format.
2.  **coverLetter**: A string containing the full text of the newly generated cover letter in Markdown format.

Follow these instructions meticulously:

**For the Resume:**
1.  **Analyze the Job Posting**: Identify the key skills, qualifications, experience level, and technologies mentioned.
2.  **Extract Resume Content**: If an image of a resume is provided, first extract all the text content from it.
3.  **Incorporate Projects**: The user has pre-selected their most relevant projects. Your task is to seamlessly integrate them.
4.  **Tailor Content**:
    *   Rewrite the descriptions of the selected projects to use keywords and phrasing from the job posting. Emphasize the impact and results.
    *   Review the applicant's existing resume content (skills, experiences). Rephrase bullet points to align with the job's requirements.
    *   Suggest a technical skills section that highlights the most relevant technologies for the role.
    *   If some experiences in the provided resume are irrelevant, omit them from the final output.
    *   Use the "Past Resume Format" as a loose inspiration for structure and tone, but prioritize clarity and impact.
5.  **Formatting**: Use Markdown for clear formatting. Use headings (#, ##), bullet points (* or -), and bold text (**text**) to structure the resume professionally.

**For the Cover Letter:**
1.  **Analyze Job & Company**: Use the job posting to understand the role and company.
2.  **Synthesize Applicant's Strengths**: Draw from the newly tailored resume content and project descriptions.
3.  **Inspiration**: Use the provided "Cover Letter Inspiration" to understand the applicant's tone, but do not copy it directly. The new letter must be unique and tailored to the new job.
4.  **Structure**: Write a professional 3-4 paragraph cover letter.
5.  **Formatting**: The output should be a single string of well-formatted Markdown.`;

  const resumeContentPrompt = appData.resumeContent 
    ? `## Applicant's Current Resume Content
\`\`\`
${appData.resumeContent}
\`\`\`` 
    : "The applicant's resume is provided as an image. Please extract the content from it.";

  const textPrompt = `
  ## Job Posting
  \`\`\`
  ${appData.jobPosting}
  \`\`\`

  ${resumeContentPrompt}

  ## Applicant's Selected Projects For This Application
  \`\`\`
  ${formatProjectsForPrompt(appData.selectedProjects)}
  \`\`\`

  ## Past Resume (for formatting reference)
  \`\`\`
  ${appData.pastResumeFormat || 'No past resume provided. Create a standard professional format.'}
  \`\`\`

  ## Cover Letter (for inspiration)
  \`\`\`
  ${appData.coverLetterInspiration || 'No cover letter provided. Write a new one from scratch.'}
  \`\`\`
  `;
  
  const contents = appData.resumeScreenshot
    ? {
        parts: [
          { text: textPrompt },
          {
            inlineData: {
              mimeType: 'image/jpeg', // Assuming jpeg, could be dynamic
              data: appData.resumeScreenshot,
            },
          },
        ],
      }
    : textPrompt;

  const response = await ai.models.generateContent({
    model,
    contents,
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          resume: { type: Type.STRING },
          coverLetter: { type: Type.STRING },
        },
        required: ["resume", "coverLetter"],
      }
    }
  });

  const jsonText = response.text.trim();
  try {
    const result = JSON.parse(jsonText);
    if (result.resume && result.coverLetter) {
      return result as OptimizedResult;
    } else {
      throw new Error("Invalid JSON structure received from API.");
    }
  } catch (error) {
     console.error("Failed to parse Gemini response:", jsonText);
     throw new Error("Could not parse the optimized data. The model may have returned an unexpected format.");
  }
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


export const getProjectAdvice = async (jobPosting: string, project: Project): Promise<string> => {
    const model = 'gemini-2.5-flash';

    const systemInstruction = `You are an expert career coach. A user is considering adding a project to their resume for a specific job application. Your task is to provide a brief, actionable analysis of whether the project is a good fit.

    Your response should be a short paragraph (2-3 sentences) and must include:
    1. A clear verdict: e.g., "Highly Relevant," "Good Fit," or "Less Relevant."
    2. A brief justification explaining why, referencing specific skills from the project and the job description.
    `;

    const prompt = `
    ## Job Posting
    \`\`\`
    ${jobPosting}
    \`\`\`

    ## Project in Question
    \`\`\`
    ${formatProjectsForPrompt([project])}
    \`\`\`

    Based on the job posting, please provide your expert advice on including this project.
    `;

    const response = await ai.models.generateContent({
        model,
        contents: prompt,
    });

    return response.text;
};
