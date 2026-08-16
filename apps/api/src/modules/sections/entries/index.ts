import type { FastifyInstance } from "fastify";
import { registerEntryRoutes } from "./factory.js";
import { workExperienceConfig } from "./kinds/work-experience.js";
import { educationConfig } from "./kinds/education.js";
import { coursesConfig } from "./kinds/courses.js";
import { skillsConfig } from "./kinds/skills.js";
import { languagesConfig } from "./kinds/languages.js";
import { hobbiesConfig } from "./kinds/hobbies.js";
import { referencesConfig } from "./kinds/references.js";

/** One route-factory call per structured entry kind — see
 * docs/api-routes.md "Section entries" and factory.ts's doc comment. */
export async function registerEntryRoutesForAllKinds(app: FastifyInstance) {
  registerEntryRoutes(app, workExperienceConfig);
  registerEntryRoutes(app, educationConfig);
  registerEntryRoutes(app, coursesConfig);
  registerEntryRoutes(app, skillsConfig);
  registerEntryRoutes(app, languagesConfig);
  registerEntryRoutes(app, hobbiesConfig);
  registerEntryRoutes(app, referencesConfig);
}
