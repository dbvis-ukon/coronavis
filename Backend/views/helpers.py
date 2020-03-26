def __as_feature_collection(resultset):
    features = []
    for elem in resultset:
        feature = elem.as_dict()
        feature['type'] = 'Feature'
        features.append(feature)
    featurecollection = {"type": "FeatureCollection", "features": features}
    return featurecollection
