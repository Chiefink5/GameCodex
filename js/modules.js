window.GCModules = (() => {
  function recipeTotals(recipe){
    const total = (recipe.ingredients || []).reduce((sum, ing) => sum + (Number(ing.percent) || 0), 0);
    return { total, ok: total === 100 };
  }

  function chainSummary(chain){
    const steps = chain.steps || [];
    const finalProduct = chain.finalProduct || (steps.length ? steps[steps.length - 1].result : chain.startProduct || '');
    return { stepCount: steps.length, finalProduct };
  }

  return { recipeTotals, chainSummary };
})();