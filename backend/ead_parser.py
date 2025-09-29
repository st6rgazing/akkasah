"""
EAD (Encoded Archival Description) Parser Service
Parses EAD XML files and extracts collection metadata
"""

import xml.etree.ElementTree as ET
from typing import Dict, List, Optional, Any
from datetime import datetime
import re
import os
from pathlib import Path


class EADParser:
    """Parser for EAD XML files"""
    
    def __init__(self):
        self.namespace = {'ead': 'urn:isbn:1-931666-22-9'}
    
    def parse_file(self, file_path: str) -> Dict[str, Any]:
        """Parse a single EAD XML file and extract metadata"""
        try:
            tree = ET.parse(file_path)
            root = tree.getroot()
            
            # Extract basic collection information
            collection_data = self._extract_collection_data(root)
            
            # Extract series and file information
            series_data = self._extract_series_data(root)
            
            # Extract administrative information
            admin_data = self._extract_admin_data(root)
            
            return {
                'collection': collection_data,
                'series': series_data,
                'administrative': admin_data,
                'file_path': file_path,
                'parsed_at': datetime.now().isoformat()
            }
            
        except Exception as e:
            print(f"Error parsing {file_path}: {str(e)}")
            return None
    
    def _extract_collection_data(self, root: ET.Element) -> Dict[str, Any]:
        """Extract collection-level metadata"""
        collection = {}
        
        # Find the archdesc element
        archdesc = root.find('.//ead:archdesc', self.namespace)
        if archdesc is None:
            return collection
        
        # Extract title
        unittitle = archdesc.find('.//ead:unittitle', self.namespace)
        if unittitle is not None:
            collection['title'] = self._clean_text(unittitle.text)
        
        # Extract unit ID
        unitid = archdesc.find('.//ead:unitid', self.namespace)
        if unitid is not None:
            collection['unit_id'] = self._clean_text(unitid.text)
        
        # Extract dates
        unitdate = archdesc.find('.//ead:unitdate', self.namespace)
        if unitdate is not None:
            collection['date_inclusive'] = self._clean_text(unitdate.text)
            collection['date_normal'] = unitdate.get('normal', '')
            collection['date_type'] = unitdate.get('type', '')
        
        # Extract extent (size/quantity)
        extent = archdesc.find('.//ead:extent[@altrender="materialtype spaceoccupied"]', self.namespace)
        if extent is not None:
            collection['extent'] = self._clean_text(extent.text)
        
        # Extract carrier information
        carrier = archdesc.find('.//ead:extent[@altrender="carrier"]', self.namespace)
        if carrier is not None:
            collection['carrier'] = self._clean_text(carrier.text)
        
        # Extract abstract/description
        abstract = archdesc.find('.//ead:abstract', self.namespace)
        if abstract is not None:
            collection['abstract'] = self._clean_text(abstract.text)
        
        # Extract scope and content
        scopecontent = archdesc.find('.//ead:scopecontent', self.namespace)
        if scopecontent is not None:
            collection['scope_content'] = self._clean_text(scopecontent.text)
        
        # Extract biographical/historical information
        bioghist = archdesc.find('.//ead:bioghist', self.namespace)
        if bioghist is not None:
            collection['biographical_historical'] = self._clean_text(bioghist.text)
        
        # Extract languages
        languages = []
        langmaterial = archdesc.find('.//ead:langmaterial', self.namespace)
        if langmaterial is not None:
            for lang in langmaterial.findall('.//ead:language', self.namespace):
                languages.append({
                    'code': lang.get('langcode', ''),
                    'script': lang.get('scriptcode', ''),
                    'text': self._clean_text(lang.text)
                })
        collection['languages'] = languages
        
        # Extract containers
        containers = []
        for container in archdesc.findall('.//ead:container', self.namespace):
            containers.append({
                'type': container.get('type', ''),
                'label': container.get('label', ''),
                'text': self._clean_text(container.text)
            })
        collection['containers'] = containers
        
        # Extract digital objects (images)
        digital_objects = []
        for dao in archdesc.findall('.//ead:dao', self.namespace):
            digital_objects.append({
                'href': dao.get('{http://www.w3.org/1999/xlink}href', ''),
                'title': dao.get('{http://www.w3.org/1999/xlink}title', ''),
                'role': dao.get('{http://www.w3.org/1999/xlink}role', ''),
                'description': self._clean_text(dao.find('.//ead:daodesc', self.namespace).text) if dao.find('.//ead:daodesc', self.namespace) is not None else ''
            })
        collection['digital_objects'] = digital_objects
        
        return collection
    
    def _extract_series_data(self, root: ET.Element) -> List[Dict[str, Any]]:
        """Extract series and file-level data"""
        series_list = []
        
        # Find all series (c elements with level="series")
        series_elements = root.findall('.//ead:c[@level="series"]', self.namespace)
        
        for series in series_elements:
            series_data = {
                'level': 'series',
                'title': '',
                'unit_id': '',
                'date_inclusive': '',
                'files': []
            }
            
            # Extract series title
            unittitle = series.find('.//ead:unittitle', self.namespace)
            if unittitle is not None:
                series_data['title'] = self._clean_text(unittitle.text)
            
            # Extract series unit ID
            unitid = series.find('.//ead:unitid', self.namespace)
            if unitid is not None:
                series_data['unit_id'] = self._clean_text(unitid.text)
            
            # Extract series date
            unitdate = series.find('.//ead:unitdate', self.namespace)
            if unitdate is not None:
                series_data['date_inclusive'] = self._clean_text(unitdate.text)
            
            # Extract files within this series
            file_elements = series.findall('.//ead:c[@level="file"]', self.namespace)
            for file_elem in file_elements:
                file_data = self._extract_file_data(file_elem)
                if file_data:
                    series_data['files'].append(file_data)
            
            series_list.append(series_data)
        
        return series_list
    
    def _extract_file_data(self, file_elem: ET.Element) -> Dict[str, Any]:
        """Extract individual file data"""
        file_data = {
            'level': 'file',
            'title': '',
            'unit_id': '',
            'date_creation': '',
            'extent': '',
            'dimensions': '',
            'languages': [],
            'containers': [],
            'digital_objects': []
        }
        
        # Extract file title
        unittitle = file_elem.find('.//ead:unittitle', self.namespace)
        if unittitle is not None:
            file_data['title'] = self._clean_text(unittitle.text)
        
        # Extract file unit ID
        unitid = file_elem.find('.//ead:unitid', self.namespace)
        if unitid is not None:
            file_data['unit_id'] = self._clean_text(unitid.text)
        
        # Extract creation date
        unitdate = file_elem.find('.//ead:unitdate', self.namespace)
        if unitdate is not None:
            file_data['date_creation'] = self._clean_text(unitdate.text)
        
        # Extract extent
        extent = file_elem.find('.//ead:extent[@altrender="materialtype spaceoccupied"]', self.namespace)
        if extent is not None:
            file_data['extent'] = self._clean_text(extent.text)
        
        # Extract dimensions
        dimensions = file_elem.find('.//ead:dimensions', self.namespace)
        if dimensions is not None:
            file_data['dimensions'] = self._clean_text(dimensions.text)
        
        # Extract languages
        langmaterial = file_elem.find('.//ead:langmaterial', self.namespace)
        if langmaterial is not None:
            for lang in langmaterial.findall('.//ead:language', self.namespace):
                file_data['languages'].append({
                    'code': lang.get('langcode', ''),
                    'script': lang.get('scriptcode', ''),
                    'text': self._clean_text(lang.text)
                })
        
        # Extract containers
        for container in file_elem.findall('.//ead:container', self.namespace):
            file_data['containers'].append({
                'type': container.get('type', ''),
                'label': container.get('label', ''),
                'text': self._clean_text(container.text)
            })
        
        # Extract digital objects for files
        for dao in file_elem.findall('.//ead:dao', self.namespace):
            file_data['digital_objects'].append({
                'href': dao.get('{http://www.w3.org/1999/xlink}href', ''),
                'title': dao.get('{http://www.w3.org/1999/xlink}title', ''),
                'role': dao.get('{http://www.w3.org/1999/xlink}role', ''),
                'description': self._clean_text(dao.find('.//ead:daodesc', self.namespace).text) if dao.find('.//ead:daodesc', self.namespace) is not None else ''
            })
        
        return file_data
    
    def _extract_admin_data(self, root: ET.Element) -> Dict[str, Any]:
        """Extract administrative metadata"""
        admin_data = {}
        
        # Extract repository information
        repository = root.find('.//ead:repository/ead:corpname', self.namespace)
        if repository is not None:
            admin_data['repository'] = self._clean_text(repository.text)
        
        # Extract finding aid status
        findaidstatus = root.find('.//ead:eadheader', self.namespace)
        if findaidstatus is not None:
            admin_data['finding_aid_status'] = findaidstatus.get('findaidstatus', '')
        
        # Extract creation date
        creation = root.find('.//ead:creation', self.namespace)
        if creation is not None:
            admin_data['creation_date'] = self._clean_text(creation.text)
        
        # Extract language usage
        langusage = root.find('.//ead:langusage', self.namespace)
        if langusage is not None:
            admin_data['language_usage'] = self._clean_text(langusage.text)
        
        return admin_data
    
    def _clean_text(self, text: str) -> str:
        """Clean and normalize text content"""
        if text is None:
            return ""
        
        # Remove extra whitespace and normalize
        text = re.sub(r'\s+', ' ', text.strip())
        return text
    
    def parse_directory(self, directory_path: str) -> List[Dict[str, Any]]:
        """Parse all EAD XML files in a directory"""
        parsed_files = []
        directory = Path(directory_path)
        
        if not directory.exists():
            print(f"Directory {directory_path} does not exist")
            return parsed_files
        
        xml_files = list(directory.glob("*.xml"))
        print(f"Found {len(xml_files)} XML files to parse")
        
        for xml_file in xml_files:
            print(f"Parsing {xml_file.name}...")
            parsed_data = self.parse_file(str(xml_file))
            if parsed_data:
                parsed_files.append(parsed_data)
        
        return parsed_files


def main():
    """Test the EAD parser"""
    parser = EADParser()
    
    # Test with a single file
    test_file = "/Users/mariam/akkasah/ArchiveFiles/AD.MC.002_20250929_091254_UTC__ead.xml"
    if os.path.exists(test_file):
        result = parser.parse_file(test_file)
        if result:
            print("Collection Title:", result['collection'].get('title', 'N/A'))
            print("Unit ID:", result['collection'].get('unit_id', 'N/A'))
            print("Date Range:", result['collection'].get('date_inclusive', 'N/A'))
            print("Extent:", result['collection'].get('extent', 'N/A'))
            print("Abstract:", result['collection'].get('abstract', 'N/A')[:200] + "...")
            print("Number of Series:", len(result['series']))
            print("Total Files:", sum(len(s['files']) for s in result['series']))


if __name__ == "__main__":
    main()
