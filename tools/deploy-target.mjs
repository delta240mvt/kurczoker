export function deploymentTarget({branch,production,config}){
 if(!branch||!/^\w[\w./-]*$/.test(branch))throw new Error('A valid named branch is required.');
 if(production!== (branch===config.productionBranch))throw new Error('Production requires --production and the configured production branch.');
 return {branch,project:config.projectName};
}
