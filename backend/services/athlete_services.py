from sqlalchemy.orm import Session
import crud

DEFAULT_PSF_TRIMP = 0.42
DEFAULT_PSF_PSS = 0.24
SMOOTHING_FACTOR = 5 # Number of activities to smooth over

def update_scaling_factors(db: Session, athlete_id: int):
    """
    Recalculates and updates the Personalized Scaling Factors (PSF) for an athlete.
    This function implements a weighted average to smoothly transition from default
    values to personalized ones as more data becomes available.
    """
    athlete = crud.get_athlete(db, athlete_id)
    if not athlete:
        return

    # --- Calculate TRIMP-to-TSS Factor (PSF_trimp) ---
    trimp_aggs = crud.get_dual_data_aggregates(db, athlete_id, "trimp")
    if trimp_aggs and trimp_aggs.total_metric and trimp_aggs.total_metric > 0:
        calculated_psf_trimp = trimp_aggs.total_tss / trimp_aggs.total_metric
        
        # Apply weighted average for smoothing
        weight = min(trimp_aggs.activity_count, SMOOTHING_FACTOR) / SMOOTHING_FACTOR
        athlete.psf_trimp = (calculated_psf_trimp * weight) + (DEFAULT_PSF_TRIMP * (1 - weight))

    # --- Calculate PSS-to-TSS Factor (PSF_pss) ---
    pss_aggs = crud.get_dual_data_aggregates(db, athlete_id, "perceived_strain_score")
    if pss_aggs and pss_aggs.total_metric and pss_aggs.total_metric > 0:
        calculated_psf_pss = pss_aggs.total_tss / pss_aggs.total_metric
        
        # Apply weighted average for smoothing
        weight = min(pss_aggs.activity_count, SMOOTHING_FACTOR) / SMOOTHING_FACTOR
        athlete.psf_pss = (calculated_psf_pss * weight) + (DEFAULT_PSF_PSS * (1 - weight))
        
    db.add(athlete)
    # The commit will be handled by the calling router to ensure atomicity
    # db.commit()

