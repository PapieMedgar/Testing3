  const onSubmit = async (data: CustomerVisitFormData) => {
    if (!outsidePhoto) {
      toast.error('Please take a photo of the outside');
      return;
    }

    if (data.putUpOurBoard === 'yes' && !boardPhoto) {
      toast.error('Please take a photo of the board');
      return;
    }

    setIsSubmitting(true);
    try {
      // Collect all photos
      const photos: File[] = [];
      if (outsidePhoto) photos.push(outsidePhoto);
      if (competitorPhotos.length > 0) photos.push(...competitorPhotos);
      if (boardPhoto) photos.push(boardPhoto);

      // Transform the form data
      const responses = VisitService.transformCustomerVisitData(data);

      // Create the visit
      const result = await VisitService.createVisit({
        shop: shop,
        location: currentLocation,
        visitType: 'customer',
        responses,
        photos,
        notes: data.notes
      });

      console.log('Visit created successfully:', result);
      toast.success('Customer visit completed successfully!');
      navigate('/visits');
    } catch (error) {
      console.error('Failed to save visit:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save visit. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
